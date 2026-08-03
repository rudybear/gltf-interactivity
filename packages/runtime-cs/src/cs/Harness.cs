// Persistent conformance-runner harness for the compiled C# backend. Speaks
// line-delimited JSON over stdin/stdout — see packages/conformance/src/
// run-compiled-cs.ts, which spawns exactly ONE of these processes for the
// whole run and drives it as an EngineLike over this protocol via the same
// mkfifo sync bridge trick run-compiled-py.ts uses against harness.py (see
// that file's own header for the full rationale). One request per line in,
// one response per line out, never buffered/batched.
//
// Commands (one-line JSON objects on stdin):
//   {"cmd":"load", "source":<str>, "gltf":<json|null>, "bin_b64":<str|null>}
//   {"cmd":"reset"}
//   {"cmd":"start"}
//   {"cmd":"advance", "dt":<num>}
//   {"cmd":"time"}
//   {"cmd":"variable_count"}
//   {"cmd":"get_var", "i":<int>}
//   {"cmd":"sent_events"}
//   {"cmd":"event_defaults"}
//   {"cmd":"eval_m", "fn":<str>, "args":[...]}   -- vitest math-parity spot checks only
//   {"cmd":"ast", "source":<str>}   -- @gltfi/parse-cs's own AST fetch (see below)
//   {"cmd":"ping"}
//
// "ast": mirrors harness.py's `{"cmd":"ast", code}` (see that file's own
// header comment) one level up the abstraction stack — where CPython's
// `ast.parse` already returns a plain, JSON-friendly tree of dicts,
// Microsoft.CodeAnalysis.CSharp's `CSharpSyntaxTree.ParseText` returns a
// typed, reflection-only object graph (SyntaxNode/SyntaxToken/SyntaxList<T>)
// with no built-in JSON projection, so `AstNodeToJson` below builds one:
// GENERIC reflection over each concrete SyntaxNode subtype's OWN declared
// properties (filtered to exclude the ones inherited from the SyntaxNode/
// CSharpSyntaxNode base classes — Parent/SyntaxTree/RawKind/... — which
// carry no @gltfi/parse-cs-relevant data), exactly mirroring how Python's
// own `ast.dump()`/`ast_to_dict` walks each node's `_fields` tuple rather
// than hand-listing every node type's shape. Every JSON object carries a
// `_type` (`SyntaxKind.ToString()`, e.g. "InvocationExpression",
// "IfStatement", "NumericLiteralExpression" — the C# counterpart of
// Python's `ast.AST._type`) plus `lineno`/`col_offset` (1-based/0-based,
// matching harness.py's own convention exactly, so @gltfi/parse-cs's own
// `fail()` helper can report "at line N, column M" identically to
// @gltfi/parse-py's). `LiteralExpressionSyntax` is the ONE node type this
// hand-codes explicitly rather than reflecting generically: its boxed
// `Token.Value` is where a numeric literal's actual CLR type (`int` vs
// `double`) lives, and preserving that distinction across the JSON wire —
// via an explicit `_ptype` tag ("int"/"float"/"str"/"bool"/"null") — is
// EXACTLY parse-py's own `_ptype` convention (see harness.py's header),
// needed for the identical reason: plain JSON has no int/float distinction
// of its own, and @gltfi/emit-cs's `csFloatLiteral`/`csIntLiteral` always
// produce an unambiguous CLR-typed literal that would otherwise round-trip
// ambiguously.
//
// Every response is a one-line JSON object `{"ok": true, ...}` or, on ANY
// exception (including a compile error in the received module source, or a
// runtime exception thrown from inside it — e.g. a bug in emit-cs's output,
// or a malformed graph), `{"ok": false, "error": "...", "traceback": "..."}`
// — the caller surfaces that as a single test failure rather than the whole
// process (and the rest of the run) going down with it.
//
// Wire encoding: mirrors harness.py's enc_num/dec_num exactly (see that
// file's own header) — plain JSON has no way to represent NaN/Infinity/
// -Infinity, so every numeric leaf that might carry a non-finite
// KHR_interactivity value crosses the wire as the STRING "NaN" / "Infinity"
// / "-Infinity" instead; finite numbers, bools, and ordinary strings are
// untouched. The counterpart encode/decode lives in run-compiled-cs.ts.
//
// Compilation: each "load" command's `source` (the FULL text of one
// @gltfi/emit-cs-generated module — a `namespace GltfiCompiled { public
// static class Module { ... public static void Build(Engine rt) {...} } }`)
// is compiled to a fresh in-memory assembly via Microsoft.CodeAnalysis.
// CSharp (Roslyn), once per "load"; "reset" reuses the already-compiled
// `Build` MethodInfo against a brand-new Engine instance, exactly mirroring
// harness.py's cmd_reset reusing its already-imported module without
// re-parsing/re-compiling. Reference assemblies are resolved once via the
// TRUSTED_PLATFORM_ASSEMBLIES trick (the standard way to hand Roslyn every
// assembly the running .NET host already has loaded, without a dedicated
// reference-assembly NuGet package).
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace GltfiRuntime;

internal sealed class Harness
{
    private static readonly Lazy<List<MetadataReference>> References = new(() =>
    {
        var list = new List<MetadataReference>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var tpa = AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") as string;
        if (tpa != null)
        {
            foreach (var path in tpa.Split(Path.PathSeparator))
            {
                if (path.Length == 0 || !File.Exists(path) || !seen.Add(path))
                {
                    continue;
                }
                try
                {
                    list.Add(MetadataReference.CreateFromFile(path));
                }
                catch
                {
                    // Not every TPA entry is a loadable managed assembly (native
                    // dependencies can show up here on some hosts) -- skip
                    // silently, matching a resolve-best-effort policy.
                }
            }
        }
        var ownPath = typeof(Engine).Assembly.Location;
        if (seen.Add(ownPath))
        {
            list.Add(MetadataReference.CreateFromFile(ownPath));
        }
        return list;
    });

    private MethodInfo _buildMethod;
    private JsonNode _gltf;
    private byte[] _glbBin;
    private Engine _engine;

    private const double DefaultSeed = 123456789.0;

    // ---------------------------------------------------------------------
    // Wire encoding (mirrors harness.py's enc_num/dec_num/enc_list exactly).
    // ---------------------------------------------------------------------

    internal static JsonNode EncodeNum(double x)
    {
        if (double.IsNaN(x))
        {
            return JsonValue.Create("NaN");
        }
        if (double.IsPositiveInfinity(x))
        {
            return JsonValue.Create("Infinity");
        }
        if (double.IsNegativeInfinity(x))
        {
            return JsonValue.Create("-Infinity");
        }
        return JsonValue.Create(x);
    }

    internal static double DecodeNum(JsonNode node)
    {
        if (node is JsonValue v && v.GetValueKind() == JsonValueKind.String)
        {
            var s = v.GetValue<string>();
            if (s == "NaN")
            {
                return double.NaN;
            }
            if (s == "Infinity")
            {
                return double.PositiveInfinity;
            }
            if (s == "-Infinity")
            {
                return double.NegativeInfinity;
            }
        }
        return node!.GetValue<double>();
    }

    private static JsonArray EncodeDataArray(KernelValue v)
    {
        var arr = new JsonArray();
        foreach (var el in v.Data)
        {
            arr.Add(el switch
            {
                bool b => JsonValue.Create(b),
                string s => JsonValue.Create(s),
                double d => EncodeNum(d),
                _ => null
            });
        }
        return arr;
    }

    // ---------------------------------------------------------------------
    // Compilation.
    // ---------------------------------------------------------------------

    private static MethodInfo CompileModule(string source)
    {
        var syntaxTree = CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.Latest));
        var compilation = CSharpCompilation.Create(
            $"GltfiCompiledModule_{Guid.NewGuid():N}",
            new[] { syntaxTree },
            References.Value,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, optimizationLevel: OptimizationLevel.Release, allowUnsafe: false));

        using var ms = new MemoryStream();
        var emitResult = compilation.Emit(ms);
        if (!emitResult.Success)
        {
            var errors = string.Join("\n", emitResult.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error).Select(d => d.ToString()));
            throw new InvalidOperationException($"compiled module failed to build:\n{errors}");
        }
        var assembly = Assembly.Load(ms.ToArray());
        var moduleType = assembly.GetType("GltfiCompiled.Module")
            ?? throw new InvalidOperationException("compiled module is missing the expected GltfiCompiled.Module type");
        var buildMethod = moduleType.GetMethod("Build", BindingFlags.Public | BindingFlags.Static)
            ?? throw new InvalidOperationException("compiled module's GltfiCompiled.Module is missing a public static Build(Engine) method");
        return buildMethod;
    }

    // ---------------------------------------------------------------------
    // Commands.
    // ---------------------------------------------------------------------

    private JsonObject CmdLoad(JsonObject req)
    {
        var source = (string)req["source"]!;
        _gltf = req.TryGetPropertyValue("gltf", out var g) ? g?.DeepClone() : null;
        var binB64 = req.TryGetPropertyValue("bin_b64", out var b) ? (string)b : null;
        _glbBin = string.IsNullOrEmpty(binB64) ? null : Convert.FromBase64String(binB64);
        _buildMethod = CompileModule(source);
        _engine = new Engine(_gltf?.DeepClone(), _glbBin, DefaultSeed);
        try
        {
            _buildMethod.Invoke(null, new object[] { _engine });
        }
        catch (TargetInvocationException ex) when (ex.InnerException != null)
        {
            throw ex.InnerException;
        }
        return new JsonObject { ["ok"] = true, ["time"] = EncodeNum(_engine.Time) };
    }

    private JsonObject CmdReset(JsonObject req)
    {
        if (_buildMethod == null)
        {
            throw new InvalidOperationException("reset called before load");
        }
        _engine = new Engine(_gltf?.DeepClone(), _glbBin, DefaultSeed);
        try
        {
            _buildMethod.Invoke(null, new object[] { _engine });
        }
        catch (TargetInvocationException ex) when (ex.InnerException != null)
        {
            throw ex.InnerException;
        }
        return new JsonObject { ["ok"] = true, ["time"] = EncodeNum(_engine.Time) };
    }

    private JsonObject CmdStart(JsonObject req)
    {
        _engine.Start();
        return new JsonObject { ["ok"] = true, ["time"] = EncodeNum(_engine.Time) };
    }

    private JsonObject CmdAdvance(JsonObject req)
    {
        var dt = DecodeNum(req["dt"]!);
        _engine.Advance(dt);
        return new JsonObject { ["ok"] = true, ["time"] = EncodeNum(_engine.Time) };
    }

    private JsonObject CmdTime(JsonObject req) => new() { ["ok"] = true, ["time"] = EncodeNum(_engine.Time) };

    private JsonObject CmdVariableCount(JsonObject req) => new() { ["ok"] = true, ["count"] = _engine.VariableCount };

    private JsonObject CmdGetVar(JsonObject req)
    {
        var i = (int)req["i"]!;
        var value = _engine.GetVariableByIndex(i);
        return new JsonObject { ["ok"] = true, ["type"] = value.Type, ["data"] = EncodeDataArray(value) };
    }

    private JsonObject CmdSentEvents(JsonObject req)
    {
        var eventsArr = new JsonArray();
        foreach (var sent in _engine.SentEvents)
        {
            var payloadArr = new JsonArray
            {
                JsonValue.Create(sent.Payload.BoolParameter),
                EncodeNum(sent.Payload.IntParameter),
                EncodeNum(sent.Payload.FloatParameter),
                EncodeNum(sent.Payload.ExpectedDuration)
            };
            eventsArr.Add(new JsonObject { ["eventIndex"] = sent.EventIndex, ["payload"] = payloadArr });
        }
        return new JsonObject { ["ok"] = true, ["events"] = eventsArr };
    }

    private JsonObject CmdEventDefaults(JsonObject req)
    {
        var arr = new JsonArray();
        foreach (var d in _engine.EventDefaults)
        {
            arr.Add(d.HasValue ? EncodeNum(d.Value) : null);
        }
        return new JsonObject { ["ok"] = true, ["defaults"] = arr };
    }

    // ---------------------------------------------------------------------
    // eval_m: vitest math-parity spot checks only -- never used by the
    // conformance runner itself (which only exercises M.* indirectly through
    // compiled modules). Resolves an M.* overload by name+arity via
    // reflection, coerces the JSON args to that overload's declared
    // parameter types, invokes it, and encodes the result.
    // ---------------------------------------------------------------------

    private static object ConvertArg(JsonNode node, Type paramType)
    {
        if (paramType == typeof(double))
        {
            return DecodeNum(node);
        }
        if (paramType == typeof(int))
        {
            return (int)DecodeNum(node);
        }
        if (paramType == typeof(bool))
        {
            return node!.GetValue<bool>();
        }
        if (paramType == typeof(string))
        {
            return node!.GetValue<string>();
        }
        if (paramType == typeof(double[]))
        {
            var arr = node!.AsArray();
            var outArr = new double[arr.Count];
            for (var i = 0; i < arr.Count; i++)
            {
                outArr[i] = DecodeNum(arr[i]!);
            }
            return outArr;
        }
        if (paramType == typeof(int[]))
        {
            var arr = node!.AsArray();
            var outArr = new int[arr.Count];
            for (var i = 0; i < arr.Count; i++)
            {
                outArr[i] = (int)DecodeNum(arr[i]!);
            }
            return outArr;
        }
        throw new NotSupportedException($"eval_m: unsupported M.* parameter type {paramType}");
    }

    private static JsonNode EncodeResult(object result)
    {
        return result switch
        {
            bool b => JsonValue.Create(b),
            int i => EncodeNum(i),
            double d => EncodeNum(d),
            string s => JsonValue.Create(s),
            double[] arr => new JsonArray(arr.Select(EncodeNum).ToArray()),
            _ => throw new NotSupportedException($"eval_m: unsupported M.* return type {result?.GetType()}")
        };
    }

    private JsonObject CmdEvalM(JsonObject req)
    {
        var fn = (string)req["fn"]!;
        var argsNode = req.TryGetPropertyValue("args", out var a) ? a!.AsArray() : new JsonArray();
        var candidates = typeof(M).GetMethods(BindingFlags.Public | BindingFlags.Static)
            .Where(m => m.Name == fn && m.GetParameters().Length == argsNode.Count)
            .ToList();
        if (candidates.Count == 0)
        {
            throw new InvalidOperationException($"no M.{fn} overload with {argsNode.Count} args");
        }
        Exception lastError = null;
        foreach (var method in candidates)
        {
            try
            {
                var ps = method.GetParameters();
                var converted = new object[ps.Length];
                for (var i = 0; i < ps.Length; i++)
                {
                    converted[i] = ConvertArg(argsNode[i]!, ps[i].ParameterType);
                }
                var result = method.Invoke(null, converted);
                return new JsonObject { ["ok"] = true, ["result"] = EncodeResult(result) };
            }
            catch (Exception ex)
            {
                lastError = ex;
            }
        }
        throw lastError ?? new InvalidOperationException($"could not invoke M.{fn}");
    }

    private static JsonObject CmdPing(JsonObject req) => new() { ["ok"] = true };

    // -----------------------------------------------------------------
    // "ast" -- see this file's header comment for the full rationale.
    // -----------------------------------------------------------------

    private static JsonObject CmdAst(JsonObject req)
    {
        var source = (string)req["source"]!;
        var tree = CSharpSyntaxTree.ParseText(source, new CSharpParseOptions(LanguageVersion.Latest));
        var errors = tree.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToList();
        if (errors.Count > 0)
        {
            throw new InvalidOperationException($"C# syntax error(s):\n{string.Join("\n", errors.Select(d => d.ToString()))}");
        }
        return new JsonObject { ["ok"] = true, ["ast"] = AstNodeToJson(tree.GetRoot()) };
    }

    // Properties declared directly on these two base classes carry no
    // @gltfi/parse-cs-relevant data (Parent/SyntaxTree/RawKind/Span/...,
    // all either redundant with `_start`/`_length`/`lineno`/`col_offset` or
    // pure plumbing) -- see this file's header note on why filtering by
    // DeclaringType is sufficient here (every genuinely meaningful field --
    // Body/Condition/Left/Right/Identifier/Modifiers/... -- is declared on
    // a CONCRETE node subtype or an intermediate abstract type like
    // MemberDeclarationSyntax/BaseTypeDeclarationSyntax, never on these two).
    private static readonly HashSet<Type> BaseNodeTypes = new() { typeof(SyntaxNode), typeof(CSharpSyntaxNode) };

    private static JsonObject AstNodeToJson(SyntaxNode node)
    {
        if (node is LiteralExpressionSyntax literal)
        {
            return EncodeLiteral(literal);
        }

        var obj = new JsonObject { ["_type"] = node.Kind().ToString() };
        SetSpan(obj, node);

        foreach (var prop in node.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (prop.GetIndexParameters().Length > 0 || BaseNodeTypes.Contains(prop.DeclaringType))
            {
                continue;
            }
            var value = prop.GetValue(node);
            var encoded = EncodePropertyValue(value);
            if (encoded != null)
            {
                obj[prop.Name] = encoded;
            }
        }
        return obj;
    }

    private static void SetSpan(JsonObject obj, SyntaxNode node)
    {
        obj["_start"] = node.SpanStart;
        obj["_length"] = node.Span.Length;
        var pos = node.GetLocation().GetLineSpan().StartLinePosition;
        obj["lineno"] = pos.Line + 1;
        obj["col_offset"] = pos.Character;
    }

    // `Token.Value` is the ONE place a numeric literal's real CLR type
    // (`int` vs `double`, from @gltfi/emit-cs's own `csIntLiteral`/
    // `csFloatLiteral`) survives -- see this file's header `_ptype` note.
    private static JsonObject EncodeLiteral(LiteralExpressionSyntax lit)
    {
        var obj = new JsonObject { ["_type"] = "Literal" };
        SetSpan(obj, lit);
        switch (lit.Kind())
        {
            case SyntaxKind.NumericLiteralExpression:
                switch (lit.Token.Value)
                {
                    case double dv:
                        obj["_ptype"] = "float";
                        obj["value"] = EncodeNum(dv);
                        break;
                    case float fv:
                        obj["_ptype"] = "float";
                        obj["value"] = EncodeNum(fv);
                        break;
                    case int iv:
                        obj["_ptype"] = "int";
                        obj["value"] = iv;
                        break;
                    case uint uv:
                        obj["_ptype"] = "int";
                        obj["value"] = (double)uv;
                        break;
                    case long lv:
                        obj["_ptype"] = "int";
                        obj["value"] = (double)lv;
                        break;
                    default:
                        obj["_ptype"] = "int";
                        obj["value"] = Convert.ToDouble(lit.Token.Value);
                        break;
                }
                break;
            case SyntaxKind.StringLiteralExpression:
                obj["_ptype"] = "str";
                obj["value"] = (string)lit.Token.Value;
                break;
            case SyntaxKind.TrueLiteralExpression:
                obj["_ptype"] = "bool";
                obj["value"] = true;
                break;
            case SyntaxKind.FalseLiteralExpression:
                obj["_ptype"] = "bool";
                obj["value"] = false;
                break;
            case SyntaxKind.NullLiteralExpression:
                obj["_ptype"] = "null";
                break;
            default:
                obj["_ptype"] = "unknown";
                break;
        }
        return obj;
    }

    // SyntaxNode -> recurse; SyntaxToken -> plain ValueText string (covers
    // identifiers -- `.ValueText` already strips a verbatim `@` prefix, so
    // `@if`'s `Identifier` property reads back as the plain string "if",
    // exactly the un-escaped name @gltfi/emit-cs's `csIdent` started from --
    // and operator/keyword tokens, whose exact spelling is rarely needed
    // since the containing node's own `Kind()` already disambiguates, same
    // as Python's dedicated `ops.Add`/`ops.Eq`/... AST nodes); SyntaxTokenList
    // -> array of ValueText strings (`Modifiers`, e.g. "public"/"static"/
    // "const"/"readonly"); SyntaxList<T>/SeparatedSyntaxList<T> -> array,
    // each element recursively encoded; primitives -> boxed straight into
    // JsonValue. Returns null for anything that should be OMITTED (a
    // missing/default token or null child node) so the caller skips the key
    // entirely, mirroring Python ast.dump()'s own "field absent" convention.
    private static JsonNode EncodePropertyValue(object value)
    {
        switch (value)
        {
            case null:
                return null;
            case SyntaxNode childNode:
                return AstNodeToJson(childNode);
            case SyntaxToken token:
                return token.RawKind == 0 ? null : JsonValue.Create(token.ValueText);
            case SyntaxTokenList tokenList:
            {
                var arr = new JsonArray();
                foreach (var t in tokenList)
                {
                    arr.Add(JsonValue.Create(t.ValueText));
                }
                return arr;
            }
            case bool b:
                return JsonValue.Create(b);
            case int i:
                return JsonValue.Create(i);
            case string s:
                return JsonValue.Create(s);
            case IEnumerable enumerable when value is not string:
            {
                var arr = new JsonArray();
                foreach (var el in enumerable)
                {
                    if (el is SyntaxNode elNode)
                    {
                        arr.Add(AstNodeToJson(elNode));
                    }
                    else if (el is SyntaxToken elToken)
                    {
                        if (elToken.RawKind != 0)
                        {
                            arr.Add(JsonValue.Create(elToken.ValueText));
                        }
                    }
                }
                return arr;
            }
            default:
                // SyntaxKind enum values (e.g. a would-be `Kind` property, or
                // any other enum-typed property some node subtype declares)
                // and anything else not otherwise handled: stringify -- never
                // reached by any shape @gltfi/emit-cs actually produces, but
                // a defensive fallback beats silently dropping the field.
                return JsonValue.Create(value.ToString());
        }
    }

    public JsonObject Handle(JsonObject req)
    {
        var cmd = (string)req["cmd"]!;
        return cmd switch
        {
            "load" => CmdLoad(req),
            "reset" => CmdReset(req),
            "start" => CmdStart(req),
            "advance" => CmdAdvance(req),
            "time" => CmdTime(req),
            "variable_count" => CmdVariableCount(req),
            "get_var" => CmdGetVar(req),
            "sent_events" => CmdSentEvents(req),
            "event_defaults" => CmdEventDefaults(req),
            "eval_m" => CmdEvalM(req),
            "ast" => CmdAst(req),
            "ping" => CmdPing(req),
            _ => new JsonObject { ["ok"] = false, ["error"] = $"unknown command '{cmd}'" }
        };
    }

    public void Run()
    {
        string line;
        while ((line = Console.In.ReadLine()) != null)
        {
            if (line.Trim().Length == 0)
            {
                continue;
            }
            JsonObject resp;
            try
            {
                var req = JsonNode.Parse(line)!.AsObject();
                resp = Handle(req);
            }
            catch (Exception ex)
            {
                resp = new JsonObject { ["ok"] = false, ["error"] = ex.Message, ["traceback"] = ex.ToString() };
            }
            Console.Out.Write(resp.ToJsonString());
            Console.Out.Write('\n');
            Console.Out.Flush();
        }
    }
}
