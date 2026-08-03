// Entry point for the persistent compiled-C#-backend conformance harness —
// see Harness.cs's own header for the full protocol/rationale. Spawned by
// packages/conformance/src/run-compiled-cs.ts as `dotnet
// bin/<config>/net8.0/gltfi-harness-cs.dll` (or the platform-native apphost
// directly), stdio wired to a pair of FIFOs exactly like run-compiled-py.ts
// spawns `python3 harness.py`.
namespace GltfiRuntime;

internal static class Program
{
    private static void Main()
    {
        new Harness().Run();
    }
}
