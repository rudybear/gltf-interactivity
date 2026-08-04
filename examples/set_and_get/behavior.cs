using System.Collections.Generic;
using GltfiRuntime;

namespace GltfiCompiled;

public static class Module
{
    public sealed class Vars
    {
        private readonly Engine E;
        public Vars(Engine e) { E = e; }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color { get => E.GetVarBool(0); set => E.SetVarBool(0, value); }
        public double[] TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color { get => E.GetVarVec(1); set => E.SetVarVec(1, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity { get => E.GetVarBool(2); set => E.SetVarBool(2, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity { get => E.GetVarFloat(3); set => E.SetVarFloat(3, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range { get => E.GetVarBool(4); set => E.SetVarBool(4, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range { get => E.GetVarFloat(5); set => E.SetVarFloat(5, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle { get => E.GetVarBool(6); set => E.SetVarBool(6, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle { get => E.GetVarFloat(7); set => E.SetVarFloat(7, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle { get => E.GetVarBool(8); set => E.SetVarBool(8, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle { get => E.GetVarFloat(9); set => E.SetVarFloat(9, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color { get => E.GetVarBool(10); set => E.SetVarBool(10, value); }
        public double[] TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color { get => E.GetVarVec(11); set => E.SetVarVec(11, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity { get => E.GetVarBool(12); set => E.SetVarBool(12, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity { get => E.GetVarFloat(13); set => E.SetVarFloat(13, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range { get => E.GetVarBool(14); set => E.SetVarBool(14, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range { get => E.GetVarFloat(15); set => E.SetVarFloat(15, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle { get => E.GetVarBool(16); set => E.SetVarBool(16, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle { get => E.GetVarFloat(17); set => E.SetVarFloat(17, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle { get => E.GetVarBool(18); set => E.SetVarBool(18, value); }
        public double TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle { get => E.GetVarFloat(19); set => E.SetVarFloat(19, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__alphaCutoff { get => E.GetVarBool(20); set => E.SetVarBool(20, value); }
        public double TestResult_pointer_set_and_get__alphaCutoff { get => E.GetVarFloat(21); set => E.SetVarFloat(21, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__emissiveFactor { get => E.GetVarBool(22); set => E.SetVarBool(22, value); }
        public double[] TestResult_pointer_set_and_get__emissiveFactor { get => E.GetVarVec(23); set => E.SetVarVec(23, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__normalTexture_scale { get => E.GetVarBool(24); set => E.SetVarBool(24, value); }
        public double TestResult_pointer_set_and_get__normalTexture_scale { get => E.GetVarFloat(25); set => E.SetVarFloat(25, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength { get => E.GetVarBool(26); set => E.SetVarBool(26, value); }
        public double TestResult_pointer_set_and_get__occlusionTexture_strength { get => E.GetVarFloat(27); set => E.SetVarFloat(27, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset { get => E.GetVarBool(28); set => E.SetVarBool(28, value); }
        public double[] TestResult_pointer_set_and_get__normalTexture_texture_offset { get => E.GetVarVec(29); set => E.SetVarVec(29, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation { get => E.GetVarBool(30); set => E.SetVarBool(30, value); }
        public double TestResult_pointer_set_and_get__normalTexture_texture_rotation { get => E.GetVarFloat(31); set => E.SetVarFloat(31, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale { get => E.GetVarBool(32); set => E.SetVarBool(32, value); }
        public double[] TestResult_pointer_set_and_get__normalTexture_texture_scale { get => E.GetVarVec(33); set => E.SetVarVec(33, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset { get => E.GetVarBool(34); set => E.SetVarBool(34, value); }
        public double[] TestResult_pointer_set_and_get__occlusionTexture_texture_offset { get => E.GetVarVec(35); set => E.SetVarVec(35, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation { get => E.GetVarBool(36); set => E.SetVarBool(36, value); }
        public double TestResult_pointer_set_and_get__occlusionTexture_texture_rotation { get => E.GetVarFloat(37); set => E.SetVarFloat(37, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale { get => E.GetVarBool(38); set => E.SetVarBool(38, value); }
        public double[] TestResult_pointer_set_and_get__occlusionTexture_texture_scale { get => E.GetVarVec(39); set => E.SetVarVec(39, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset { get => E.GetVarBool(40); set => E.SetVarBool(40, value); }
        public double[] TestResult_pointer_set_and_get__emissiveTexture_texture_offset { get => E.GetVarVec(41); set => E.SetVarVec(41, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation { get => E.GetVarBool(42); set => E.SetVarBool(42, value); }
        public double TestResult_pointer_set_and_get__emissiveTexture_texture_rotation { get => E.GetVarFloat(43); set => E.SetVarFloat(43, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale { get => E.GetVarBool(44); set => E.SetVarBool(44, value); }
        public double[] TestResult_pointer_set_and_get__emissiveTexture_texture_scale { get => E.GetVarVec(45); set => E.SetVarVec(45, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__baseColorFactor { get => E.GetVarBool(46); set => E.SetVarBool(46, value); }
        public double[] TestResult_pointer_set_and_get__baseColorFactor { get => E.GetVarVec(47); set => E.SetVarVec(47, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__metallicFactor { get => E.GetVarBool(48); set => E.SetVarBool(48, value); }
        public double TestResult_pointer_set_and_get__metallicFactor { get => E.GetVarFloat(49); set => E.SetVarFloat(49, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__roughnessFactor { get => E.GetVarBool(50); set => E.SetVarBool(50, value); }
        public double TestResult_pointer_set_and_get__roughnessFactor { get => E.GetVarFloat(51); set => E.SetVarFloat(51, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset { get => E.GetVarBool(52); set => E.SetVarBool(52, value); }
        public double[] TestResult_pointer_set_and_get__baseColorTexture_texture_offset { get => E.GetVarVec(53); set => E.SetVarVec(53, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation { get => E.GetVarBool(54); set => E.SetVarBool(54, value); }
        public double TestResult_pointer_set_and_get__baseColorTexture_texture_rotation { get => E.GetVarFloat(55); set => E.SetVarFloat(55, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale { get => E.GetVarBool(56); set => E.SetVarBool(56, value); }
        public double[] TestResult_pointer_set_and_get__baseColorTexture_texture_scale { get => E.GetVarVec(57); set => E.SetVarVec(57, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset { get => E.GetVarBool(58); set => E.SetVarBool(58, value); }
        public double[] TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset { get => E.GetVarVec(59); set => E.SetVarVec(59, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation { get => E.GetVarBool(60); set => E.SetVarBool(60, value); }
        public double TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation { get => E.GetVarFloat(61); set => E.SetVarFloat(61, value); }
        public bool TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale { get => E.GetVarBool(62); set => E.SetVarBool(62, value); }
        public double[] TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale { get => E.GetVarVec(63); set => E.SetVarVec(63, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength { get => E.GetVarBool(64); set => E.SetVarBool(64, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength { get => E.GetVarFloat(65); set => E.SetVarFloat(65, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation { get => E.GetVarBool(66); set => E.SetVarBool(66, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation { get => E.GetVarFloat(67); set => E.SetVarFloat(67, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset { get => E.GetVarBool(68); set => E.SetVarBool(68, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset { get => E.GetVarVec(69); set => E.SetVarVec(69, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation { get => E.GetVarBool(70); set => E.SetVarBool(70, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation { get => E.GetVarFloat(71); set => E.SetVarFloat(71, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale { get => E.GetVarBool(72); set => E.SetVarBool(72, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale { get => E.GetVarVec(73); set => E.SetVarVec(73, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset { get => E.GetVarBool(74); set => E.SetVarBool(74, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset { get => E.GetVarVec(75); set => E.SetVarVec(75, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation { get => E.GetVarBool(76); set => E.SetVarBool(76, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation { get => E.GetVarFloat(77); set => E.SetVarFloat(77, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale { get => E.GetVarBool(78); set => E.SetVarBool(78, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale { get => E.GetVarVec(79); set => E.SetVarVec(79, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset { get => E.GetVarBool(80); set => E.SetVarBool(80, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset { get => E.GetVarVec(81); set => E.SetVarVec(81, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation { get => E.GetVarBool(82); set => E.SetVarBool(82, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation { get => E.GetVarFloat(83); set => E.SetVarFloat(83, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale { get => E.GetVarBool(84); set => E.SetVarBool(84, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale { get => E.GetVarVec(85); set => E.SetVarVec(85, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion { get => E.GetVarBool(86); set => E.SetVarBool(86, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion { get => E.GetVarFloat(87); set => E.SetVarFloat(87, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength { get => E.GetVarBool(88); set => E.SetVarBool(88, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength { get => E.GetVarFloat(89); set => E.SetVarFloat(89, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior { get => E.GetVarBool(90); set => E.SetVarBool(90, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_ior_ior { get => E.GetVarFloat(91); set => E.SetVarFloat(91, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor { get => E.GetVarBool(92); set => E.SetVarBool(92, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor { get => E.GetVarFloat(93); set => E.SetVarFloat(93, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor { get => E.GetVarBool(94); set => E.SetVarBool(94, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor { get => E.GetVarFloat(95); set => E.SetVarFloat(95, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum { get => E.GetVarBool(96); set => E.SetVarBool(96, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum { get => E.GetVarFloat(97); set => E.SetVarFloat(97, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum { get => E.GetVarBool(98); set => E.SetVarBool(98, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum { get => E.GetVarFloat(99); set => E.SetVarFloat(99, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset { get => E.GetVarBool(100); set => E.SetVarBool(100, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset { get => E.GetVarVec(101); set => E.SetVarVec(101, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation { get => E.GetVarBool(102); set => E.SetVarBool(102, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation { get => E.GetVarFloat(103); set => E.SetVarFloat(103, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale { get => E.GetVarBool(104); set => E.SetVarBool(104, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale { get => E.GetVarVec(105); set => E.SetVarVec(105, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset { get => E.GetVarBool(106); set => E.SetVarBool(106, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset { get => E.GetVarVec(107); set => E.SetVarVec(107, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation { get => E.GetVarBool(108); set => E.SetVarBool(108, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation { get => E.GetVarFloat(109); set => E.SetVarFloat(109, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale { get => E.GetVarBool(110); set => E.SetVarBool(110, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale { get => E.GetVarVec(111); set => E.SetVarVec(111, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor { get => E.GetVarBool(112); set => E.SetVarBool(112, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor { get => E.GetVarVec(113); set => E.SetVarVec(113, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor { get => E.GetVarBool(114); set => E.SetVarBool(114, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor { get => E.GetVarFloat(115); set => E.SetVarFloat(115, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset { get => E.GetVarBool(116); set => E.SetVarBool(116, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset { get => E.GetVarVec(117); set => E.SetVarVec(117, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation { get => E.GetVarBool(118); set => E.SetVarBool(118, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation { get => E.GetVarFloat(119); set => E.SetVarFloat(119, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale { get => E.GetVarBool(120); set => E.SetVarBool(120, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale { get => E.GetVarVec(121); set => E.SetVarVec(121, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset { get => E.GetVarBool(122); set => E.SetVarBool(122, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset { get => E.GetVarVec(123); set => E.SetVarVec(123, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation { get => E.GetVarBool(124); set => E.SetVarBool(124, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation { get => E.GetVarFloat(125); set => E.SetVarFloat(125, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale { get => E.GetVarBool(126); set => E.SetVarBool(126, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale { get => E.GetVarVec(127); set => E.SetVarVec(127, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor { get => E.GetVarBool(128); set => E.SetVarBool(128, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor { get => E.GetVarFloat(129); set => E.SetVarFloat(129, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor { get => E.GetVarBool(130); set => E.SetVarBool(130, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor { get => E.GetVarVec(131); set => E.SetVarVec(131, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset { get => E.GetVarBool(132); set => E.SetVarBool(132, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset { get => E.GetVarVec(133); set => E.SetVarVec(133, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation { get => E.GetVarBool(134); set => E.SetVarBool(134, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation { get => E.GetVarFloat(135); set => E.SetVarFloat(135, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale { get => E.GetVarBool(136); set => E.SetVarBool(136, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale { get => E.GetVarVec(137); set => E.SetVarVec(137, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset { get => E.GetVarBool(138); set => E.SetVarBool(138, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset { get => E.GetVarVec(139); set => E.SetVarVec(139, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation { get => E.GetVarBool(140); set => E.SetVarBool(140, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation { get => E.GetVarFloat(141); set => E.SetVarFloat(141, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale { get => E.GetVarBool(142); set => E.SetVarBool(142, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale { get => E.GetVarVec(143); set => E.SetVarVec(143, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor { get => E.GetVarBool(144); set => E.SetVarBool(144, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor { get => E.GetVarFloat(145); set => E.SetVarFloat(145, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset { get => E.GetVarBool(146); set => E.SetVarBool(146, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset { get => E.GetVarVec(147); set => E.SetVarVec(147, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation { get => E.GetVarBool(148); set => E.SetVarBool(148, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation { get => E.GetVarFloat(149); set => E.SetVarFloat(149, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale { get => E.GetVarBool(150); set => E.SetVarBool(150, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale { get => E.GetVarVec(151); set => E.SetVarVec(151, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor { get => E.GetVarBool(152); set => E.SetVarBool(152, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor { get => E.GetVarFloat(153); set => E.SetVarFloat(153, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance { get => E.GetVarBool(154); set => E.SetVarBool(154, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance { get => E.GetVarFloat(155); set => E.SetVarFloat(155, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor { get => E.GetVarBool(156); set => E.SetVarBool(156, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor { get => E.GetVarVec(157); set => E.SetVarVec(157, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset { get => E.GetVarBool(158); set => E.SetVarBool(158, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset { get => E.GetVarVec(159); set => E.SetVarVec(159, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation { get => E.GetVarBool(160); set => E.SetVarBool(160, value); }
        public double TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation { get => E.GetVarFloat(161); set => E.SetVarFloat(161, value); }
        public bool TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale { get => E.GetVarBool(162); set => E.SetVarBool(162, value); }
        public double[] TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale { get => E.GetVarVec(163); set => E.SetVarVec(163, value); }
    }

    public static class Events
    {
        public const int test_onStart = 0;
        public const int test_onSuccess = 1;
        public const int test_onFailed = 2;
    }

    public static void Build(Engine rt)
    {
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/alphaCutoff");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/alphaCutoff");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/emissiveFactor");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_pointer/set and get_/emissiveFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/normalTexture/scale");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/normalTexture/scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/occlusionTexture/strength");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/occlusionTexture/strength");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/normalTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/normalTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/normalTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/normalTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/normalTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/normalTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/occlusionTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/occlusionTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/occlusionTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/occlusionTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/occlusionTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/occlusionTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/emissiveTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/emissiveTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/emissiveTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/emissiveTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/emissiveTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/emissiveTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/baseColorFactor");
        rt.DeclareVar("float4", new double[] { -0.0142, -0.0142, -0.0142, 0.0 }, "TestResult_pointer/set and get_/baseColorFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/metallicFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/metallicFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/roughnessFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/roughnessFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/baseColorTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/baseColorTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/baseColorTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/baseColorTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/baseColorTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/baseColorTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/metallicRoughnessTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_/metallicRoughnessTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_/metallicRoughnessTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_dispersion/dispersion");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_dispersion/dispersion");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_ior/ior");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_ior/ior");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceIor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceIor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorFactor");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_specular/specularFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorFactor");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_specular/specularColorFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_transmission/transmissionFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessFactor");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_volume/thicknessFactor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationDistance");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_volume/attenuationDistance");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationColor");
        rt.DeclareVar("float3", new double[] { -0.0142, -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_volume/attenuationColor");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation");
        rt.DeclareVar("float", -0.0142, "TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation");
        rt.DeclareVar("bool", false, "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale");
        rt.DeclareVar("float2", new double[] { -0.0142, -0.0142 }, "TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale");
        rt.DeclareEvent("test/onStart", (bool?)null, (int?)null, (double?)null, (double?)0.0);
        rt.DeclareEvent("test/onSuccess", (bool?)null, (int?)null, (double?)null, (double?)null);
        rt.DeclareEvent("test/onFailed", (bool?)null, (int?)null, (double?)null, (double?)null);
        var V = new Vars(rt);
        void proc7()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").Value, new double[] { 1.0, 0.0, 0.0 } });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = (double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").Value;
        }
        void proc23()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").Value, 4.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").Value;
        }
        void proc39()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").Value, 9.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").Value;
        }
        void proc218()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").Value, 2.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").Value;
        }
        void proc233()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").Value, 5.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").Value;
        }
        void proc248()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", "float3", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/5" }).Value, new double[] { 1.0, 0.0, 0.0 } });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = (double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", "float3", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/5" }).Value;
        }
        void proc263()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/6" }).Value, 4.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/6" }).Value;
        }
        void proc278()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/7" }).Value, 9.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/7" }).Value;
        }
        void proc293()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/8" }).Value, 2.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/8" }).Value;
        }
        void proc308()
        {
            rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/9" }).Value, 5.0 });
            V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/9" }).Value;
        }
        void proc323()
        {
            rt.Log("<pointer/set and get - /alphaCutoff>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/6/alphaCutoff", "float").Value, 0.5 });
            V.TestResult_pointer_set_and_get__alphaCutoff = (double)rt.PtrGet("/materials/6/alphaCutoff", "float").Value;
        }
        void proc338()
        {
            rt.Log("<pointer/set and get - /emissiveFactor>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/emissiveFactor", "float3").Value, new double[] { 1.0, 0.0, 0.0 } });
            V.TestResult_pointer_set_and_get__emissiveFactor = (double[])rt.PtrGet("/materials/6/emissiveFactor", "float3").Value;
        }
        void proc353()
        {
            rt.Log("<pointer/set and get - /normalTexture/scale>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/6/normalTexture/scale", "float").Value, 0.5 });
            V.TestResult_pointer_set_and_get__normalTexture_scale = (double)rt.PtrGet("/materials/6/normalTexture/scale", "float").Value;
        }
        void proc368()
        {
            rt.Log("<pointer/set and get - /occlusionTexture/strength>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/6/occlusionTexture/strength", "float").Value, 0.5 });
            V.TestResult_pointer_set_and_get__occlusionTexture_strength = (double)rt.PtrGet("/materials/6/occlusionTexture/strength", "float").Value;
        }
        void proc383()
        {
            rt.Log("<pointer/set and get - /normalTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__normalTexture_texture_offset = (double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc400()
        {
            rt.Log("<pointer/set and get - /normalTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get__normalTexture_texture_rotation = (double)rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc415()
        {
            rt.Log("<pointer/set and get - /normalTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__normalTexture_texture_scale = (double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc430()
        {
            rt.Log("<pointer/set and get - /occlusionTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__occlusionTexture_texture_offset = (double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc447()
        {
            rt.Log("<pointer/set and get - /occlusionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get__occlusionTexture_texture_rotation = (double)rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc462()
        {
            rt.Log("<pointer/set and get - /occlusionTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__occlusionTexture_texture_scale = (double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc477()
        {
            rt.Log("<pointer/set and get - /emissiveTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__emissiveTexture_texture_offset = (double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc494()
        {
            rt.Log("<pointer/set and get - /emissiveTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get__emissiveTexture_texture_rotation = (double)rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc509()
        {
            rt.Log("<pointer/set and get - /emissiveTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__emissiveTexture_texture_scale = (double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc524()
        {
            rt.Log("<pointer/set and get - /baseColorFactor>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").Value, new double[] { 0.0, 0.0, 1.0, 1.0 } });
            V.TestResult_pointer_set_and_get__baseColorFactor = (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").Value;
        }
        void proc539()
        {
            rt.Log("<pointer/set and get - /metallicFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").Value, 0.5 });
            V.TestResult_pointer_set_and_get__metallicFactor = (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").Value;
        }
        void proc554()
        {
            rt.Log("<pointer/set and get - /roughnessFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").Value, 0.5 });
            V.TestResult_pointer_set_and_get__roughnessFactor = (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").Value;
        }
        void proc569()
        {
            rt.Log("<pointer/set and get - /baseColorTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__baseColorTexture_texture_offset = (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc586()
        {
            rt.Log("<pointer/set and get - /baseColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get__baseColorTexture_texture_rotation = (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc601()
        {
            rt.Log("<pointer/set and get - /baseColorTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__baseColorTexture_texture_scale = (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc616()
        {
            rt.Log("<pointer/set and get - /metallicRoughnessTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset = (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc633()
        {
            rt.Log("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc648()
        {
            rt.Log("<pointer/set and get - /metallicRoughnessTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale = (double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc663()
        {
            rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").Value, 2.0 });
            V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").Value;
        }
        void proc680()
        {
            rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").Value, 0.5235988 });
            V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").Value;
        }
        void proc695()
        {
            rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = (double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc712()
        {
            rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc727()
        {
            rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = (double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc742()
        {
            rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc759()
        {
            rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = (double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc774()
        {
            rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc789()
        {
            rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc806()
        {
            rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = (double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc821()
        {
            rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = (double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc836()
        {
            rt.Log("<pointer/set and get - KHR_materials_dispersion/dispersion>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").Value, 2.0 });
            V.TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion = (double)rt.PtrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").Value;
        }
        void proc851()
        {
            rt.Log("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").Value, 2.0 });
            V.TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = (double)rt.PtrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").Value;
        }
        void proc866()
        {
            rt.Log("<pointer/set and get - KHR_materials_ior/ior>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").Value, 3.0 });
            V.TestResult_pointer_set_and_get_KHR_materials_ior_ior = (double)rt.PtrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").Value;
        }
        void proc881()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").Value, 1.2 });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").Value;
        }
        void proc896()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").Value, 2.3 });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").Value;
        }
        void proc911()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").Value, 0.5 });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").Value;
        }
        void proc926()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").Value, 1.2 });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").Value;
        }
        void proc941()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc958()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc973()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc988()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1005()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1020()
        {
            rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = (double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc1035()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").Value, new double[] { 0.0, 0.0, 1.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").Value;
        }
        void proc1050()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").Value, 2.3 });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").Value;
        }
        void proc1065()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1082()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1097()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc1112()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1129()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1144()
        {
            rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = (double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc1159()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").Value, 1.2 });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor = (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").Value;
        }
        void proc1174()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").Value, new double[] { 1.0, 0.0, 0.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor = (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").Value;
        }
        void proc1189()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1206()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1221()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc1236()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1253()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1268()
        {
            rt.Log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = (double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc1283()
        {
            rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").Value, 1.2 });
            V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = (double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").Value;
        }
        void proc1298()
        {
            rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = (double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1315()
        {
            rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = (double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1330()
        {
            rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = (double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void proc1345()
        {
            rt.Log("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").Value, 1.2 });
            V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor = (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").Value;
        }
        void proc1360()
        {
            rt.Log("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Value is {0}, should be {1} ", new object[] { (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").Value, 2.2 });
            V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance = (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").Value;
        }
        void proc1375()
        {
            rt.Log("<pointer/set and get - KHR_materials_volume/attenuationColor>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").Value, new double[] { 1.0, 0.0, 0.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor = (double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").Value;
        }
        void proc1390()
        {
            rt.Log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = (double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value;
        }
        void proc1407()
        {
            rt.Log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", new object[] { (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value, 0.7853982 });
            V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value;
        }
        void proc1422()
        {
            rt.Log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Value is {0}, should be {1} ", new object[] { (double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 } });
            V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = (double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value;
        }
        void OnStart0()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/0/color", "float3", new double[] { 1.0, 0.0, 0.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").Value, new double[] { 1.0, 0.0, 0.0 }))
                {
                    if (rt.PtrSet("/nodes/5/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = M.Eq((double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").Value, new double[] { 1.0, 0.0, 0.0 });
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Successful");
                        proc7();
                    }
                }
                else
                {
                    proc7();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/0/color with (1.00, 0.00, 0.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Failed");
            }
        }
        rt.OnStart(OnStart0);
        void OnStart1()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/1/intensity", "float", 4.0))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").Value == 4.0)
                {
                    if (rt.PtrSet("/nodes/12/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").Value == 4.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Test Successful");
                        proc23();
                    }
                }
                else
                {
                    proc23();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/1/intensity with 4 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Test Failed");
            }
        }
        rt.OnStart(OnStart1);
        void OnStart2()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/2/range", "float", 9.0))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").Value == 9.0)
                {
                    if (rt.PtrSet("/nodes/19/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").Value == 9.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Test Successful");
                        proc39();
                    }
                }
                else
                {
                    proc39();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/2/range with 9 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Test Failed");
            }
        }
        rt.OnStart(OnStart2);
        void OnStart3()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float", 2.0))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").Value == 2.0)
                {
                    if (rt.PtrSet("/nodes/26/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").Value == 2.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Test Successful");
                        proc218();
                    }
                }
                else
                {
                    proc218();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle with 2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Test Failed");
            }
        }
        rt.OnStart(OnStart3);
        void OnStart4()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float", 5.0))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").Value == 5.0)
                {
                    if (rt.PtrSet("/nodes/33/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").Value == 5.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Test Successful");
                        proc233();
                    }
                }
                else
                {
                    proc233();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle with 5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Test Failed");
            }
        }
        rt.OnStart(OnStart4);
        void OnStart5()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", "float3", new double[] { 1.0, 0.0, 0.0 }, new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/5" }))
            {
                if (M.Eq((double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", "float3", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/5" }).Value, new double[] { 1.0, 0.0, 0.0 }))
                {
                    if (rt.PtrSet("/nodes/40/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = M.Eq((double[])rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", "float3", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/5" }).Value, new double[] { 1.0, 0.0, 0.0 });
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Test Successful");
                        proc248();
                    }
                }
                else
                {
                    proc248();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/5/color with (1.00, 0.00, 0.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Test Failed");
            }
        }
        rt.OnStart(OnStart5);
        void OnStart6()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", "float", 4.0, new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/6" }))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/6" }).Value == 4.0)
                {
                    if (rt.PtrSet("/nodes/47/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/6" }).Value == 4.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Test Successful");
                        proc263();
                    }
                }
                else
                {
                    proc263();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/6/intensity with 4 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Test Failed");
            }
        }
        rt.OnStart(OnStart6);
        void OnStart7()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", "float", 9.0, new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/7" }))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/7" }).Value == 9.0)
                {
                    if (rt.PtrSet("/nodes/54/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/7" }).Value == 9.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Test Successful");
                        proc278();
                    }
                }
                else
                {
                    proc278();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/7/range with 9 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Test Failed");
            }
        }
        rt.OnStart(OnStart7);
        void OnStart8()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", "float", 2.0, new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/8" }))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/8" }).Value == 2.0)
                {
                    if (rt.PtrSet("/nodes/61/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/8" }).Value == 2.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Test Successful");
                        proc293();
                    }
                }
                else
                {
                    proc293();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/8/spot/innerConeAngle with 2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Test Failed");
            }
        }
        rt.OnStart(OnStart8);
        void OnStart9()
        {
            if (rt.PtrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", "float", 5.0, new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/9" }))
            {
                if ((double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/9" }).Value == 5.0)
                {
                    if (rt.PtrSet("/nodes/68/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = (double)rt.PtrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", "float", new Dictionary<string, object> { ["lightRef"] = "/extensions/KHR_lights_punctual/lights/9" }).Value == 5.0;
                        rt.Log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Test Successful");
                        proc308();
                    }
                }
                else
                {
                    proc308();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/9/spot/outerConeAngle with 5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle)
            {
                rt.Log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Test Failed");
            }
        }
        rt.OnStart(OnStart9);
        void OnStart10()
        {
            if (rt.PtrSet("/materials/6/alphaCutoff", "float", 0.5))
            {
                if ((double)rt.PtrGet("/materials/6/alphaCutoff", "float").Value == 0.5)
                {
                    if (rt.PtrSet("/nodes/75/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff = (double)rt.PtrGet("/materials/6/alphaCutoff", "float").Value == 0.5;
                        rt.Log("<pointer/set and get - /alphaCutoff>: Test Successful");
                        proc323();
                    }
                }
                else
                {
                    proc323();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/alphaCutoff with 0,5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff)
            {
                rt.Log("ERROR! <pointer/set and get - /alphaCutoff>: Test Failed");
            }
        }
        rt.OnStart(OnStart10);
        void OnStart11()
        {
            if (rt.PtrSet("/materials/6/emissiveFactor", "float3", new double[] { 1.0, 0.0, 0.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/emissiveFactor", "float3").Value, new double[] { 1.0, 0.0, 0.0 }))
                {
                    if (rt.PtrSet("/nodes/81/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor = M.Eq((double[])rt.PtrGet("/materials/6/emissiveFactor", "float3").Value, new double[] { 1.0, 0.0, 0.0 });
                        rt.Log("<pointer/set and get - /emissiveFactor>: Test Successful");
                        proc338();
                    }
                }
                else
                {
                    proc338();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveFactor with (1.00, 0.00, 0.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor)
            {
                rt.Log("ERROR! <pointer/set and get - /emissiveFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart11);
        void OnStart12()
        {
            if (rt.PtrSet("/materials/6/normalTexture/scale", "float", 0.5))
            {
                if ((double)rt.PtrGet("/materials/6/normalTexture/scale", "float").Value == 0.5)
                {
                    if (rt.PtrSet("/nodes/87/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale = (double)rt.PtrGet("/materials/6/normalTexture/scale", "float").Value == 0.5;
                        rt.Log("<pointer/set and get - /normalTexture/scale>: Test Successful");
                        proc353();
                    }
                }
                else
                {
                    proc353();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/scale with 0,5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - /normalTexture/scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart12);
        void OnStart13()
        {
            if (rt.PtrSet("/materials/6/occlusionTexture/strength", "float", 0.5))
            {
                if ((double)rt.PtrGet("/materials/6/occlusionTexture/strength", "float").Value == 0.5)
                {
                    if (rt.PtrSet("/nodes/93/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength = (double)rt.PtrGet("/materials/6/occlusionTexture/strength", "float").Value == 0.5;
                        rt.Log("<pointer/set and get - /occlusionTexture/strength>: Test Successful");
                        proc368();
                    }
                }
                else
                {
                    proc368();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/strength with 0,5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength)
            {
                rt.Log("ERROR! <pointer/set and get - /occlusionTexture/strength>: Test Failed");
            }
        }
        rt.OnStart(OnStart13);
        void OnStart14()
        {
            if (rt.PtrSet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/99/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /normalTexture texture offset>: Test Successful");
                        proc383();
                    }
                }
                else
                {
                    proc383();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - /normalTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart14);
        void OnStart15()
        {
            if (rt.PtrSet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/105/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - /normalTexture texture rotation>: Test Successful");
                        proc400();
                    }
                }
                else
                {
                    proc400();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - /normalTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart15);
        void OnStart16()
        {
            if (rt.PtrSet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/111/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /normalTexture texture scale>: Test Successful");
                        proc415();
                    }
                }
                else
                {
                    proc415();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - /normalTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart16);
        void OnStart17()
        {
            if (rt.PtrSet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/117/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /occlusionTexture texture offset>: Test Successful");
                        proc430();
                    }
                }
                else
                {
                    proc430();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - /occlusionTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart17);
        void OnStart18()
        {
            if (rt.PtrSet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/123/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - /occlusionTexture texture rotation>: Test Successful");
                        proc447();
                    }
                }
                else
                {
                    proc447();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - /occlusionTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart18);
        void OnStart19()
        {
            if (rt.PtrSet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/129/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /occlusionTexture texture scale>: Test Successful");
                        proc462();
                    }
                }
                else
                {
                    proc462();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - /occlusionTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart19);
        void OnStart20()
        {
            if (rt.PtrSet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/135/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /emissiveTexture texture offset>: Test Successful");
                        proc477();
                    }
                }
                else
                {
                    proc477();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - /emissiveTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart20);
        void OnStart21()
        {
            if (rt.PtrSet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/141/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - /emissiveTexture texture rotation>: Test Successful");
                        proc494();
                    }
                }
                else
                {
                    proc494();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - /emissiveTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart21);
        void OnStart22()
        {
            if (rt.PtrSet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/147/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /emissiveTexture texture scale>: Test Successful");
                        proc509();
                    }
                }
                else
                {
                    proc509();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - /emissiveTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart22);
        void OnStart23()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4", new double[] { 0.0, 0.0, 1.0, 1.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").Value, new double[] { 0.0, 0.0, 1.0, 1.0 }))
                {
                    if (rt.PtrSet("/nodes/154/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor = M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").Value, new double[] { 0.0, 0.0, 1.0, 1.0 });
                        rt.Log("<pointer/set and get - /baseColorFactor>: Test Successful");
                        proc524();
                    }
                }
                else
                {
                    proc524();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorFactor with RGBA(0.000, 0.000, 1.000, 1.000) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor)
            {
                rt.Log("ERROR! <pointer/set and get - /baseColorFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart23);
        void OnStart24()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/metallicFactor", "float", 0.5))
            {
                if ((double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").Value == 0.5)
                {
                    if (rt.PtrSet("/nodes/160/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__metallicFactor = (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").Value == 0.5;
                        rt.Log("<pointer/set and get - /metallicFactor>: Test Successful");
                        proc539();
                    }
                }
                else
                {
                    proc539();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicFactor with 0,5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__metallicFactor)
            {
                rt.Log("ERROR! <pointer/set and get - /metallicFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart24);
        void OnStart25()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float", 0.5))
            {
                if ((double)rt.PtrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").Value == 0.5)
                {
                    if (rt.PtrSet("/nodes/166/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor = (double)rt.PtrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").Value == 0.5;
                        rt.Log("<pointer/set and get - /roughnessFactor>: Test Successful");
                        proc554();
                    }
                }
                else
                {
                    proc554();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/roughnessFactor with 0,5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor)
            {
                rt.Log("ERROR! <pointer/set and get - /roughnessFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart25);
        void OnStart26()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/172/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /baseColorTexture texture offset>: Test Successful");
                        proc569();
                    }
                }
                else
                {
                    proc569();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - /baseColorTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart26);
        void OnStart27()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/178/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - /baseColorTexture texture rotation>: Test Successful");
                        proc586();
                    }
                }
                else
                {
                    proc586();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - /baseColorTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart27);
        void OnStart28()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/184/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /baseColorTexture texture scale>: Test Successful");
                        proc601();
                    }
                }
                else
                {
                    proc601();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - /baseColorTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart28);
        void OnStart29()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/190/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /metallicRoughnessTexture texture offset>: Test Successful");
                        proc616();
                    }
                }
                else
                {
                    proc616();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - /metallicRoughnessTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart29);
        void OnStart30()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/196/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Test Successful");
                        proc633();
                    }
                }
                else
                {
                    proc633();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - /metallicRoughnessTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart30);
        void OnStart31()
        {
            if (rt.PtrSet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/202/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - /metallicRoughnessTexture texture scale>: Test Successful");
                        proc648();
                    }
                }
                else
                {
                    proc648();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - /metallicRoughnessTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart31);
        void OnStart32()
        {
            if (rt.PtrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float", 2.0))
            {
                if ((double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").Value == 2.0)
                {
                    if (rt.PtrSet("/nodes/209/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = (double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").Value == 2.0;
                        rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Test Successful");
                        proc663();
                    }
                }
                else
                {
                    proc663();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength with 2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Test Failed");
            }
        }
        rt.OnStart(OnStart32);
        void OnStart33()
        {
            if (rt.PtrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float", 0.5235988))
            {
                if (M.Abs((double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").Value - 0.5235988) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/215/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = M.Abs((double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").Value - 0.5235988) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Test Successful");
                        proc680();
                    }
                }
                else
                {
                    proc680();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation with 0,5235988 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart33);
        void OnStart34()
        {
            if (rt.PtrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/221/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Test Successful");
                        proc695();
                    }
                }
                else
                {
                    proc695();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart34);
        void OnStart35()
        {
            if (rt.PtrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/227/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Test Successful");
                        proc712();
                    }
                }
                else
                {
                    proc712();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart35);
        void OnStart36()
        {
            if (rt.PtrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/233/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Test Successful");
                        proc727();
                    }
                }
                else
                {
                    proc727();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart36);
        void OnStart37()
        {
            if (rt.PtrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/240/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Test Successful");
                        proc742();
                    }
                }
                else
                {
                    proc742();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart37);
        void OnStart38()
        {
            if (rt.PtrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/246/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Test Successful");
                        proc759();
                    }
                }
                else
                {
                    proc759();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart38);
        void OnStart39()
        {
            if (rt.PtrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/252/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Test Successful");
                        proc774();
                    }
                }
                else
                {
                    proc774();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart39);
        void OnStart40()
        {
            if (rt.PtrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/258/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Test Successful");
                        proc789();
                    }
                }
                else
                {
                    proc789();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart40);
        void OnStart41()
        {
            if (rt.PtrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/264/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Test Successful");
                        proc806();
                    }
                }
                else
                {
                    proc806();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart41);
        void OnStart42()
        {
            if (rt.PtrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/270/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Test Successful");
                        proc821();
                    }
                }
                else
                {
                    proc821();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart42);
        void OnStart43()
        {
            if (rt.PtrSet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float", 2.0))
            {
                if ((double)rt.PtrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").Value == 2.0)
                {
                    if (rt.PtrSet("/nodes/277/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion = (double)rt.PtrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").Value == 2.0;
                        rt.Log("<pointer/set and get - KHR_materials_dispersion/dispersion>: Test Successful");
                        proc836();
                    }
                }
                else
                {
                    proc836();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/10/extensions/KHR_materials_dispersion/dispersion with 2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_dispersion/dispersion>: Test Failed");
            }
        }
        rt.OnStart(OnStart43);
        void OnStart44()
        {
            if (rt.PtrSet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float", 2.0))
            {
                if ((double)rt.PtrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").Value == 2.0)
                {
                    if (rt.PtrSet("/nodes/284/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = (double)rt.PtrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").Value == 2.0;
                        rt.Log("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Test Successful");
                        proc851();
                    }
                }
                else
                {
                    proc851();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength with 2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Test Failed");
            }
        }
        rt.OnStart(OnStart44);
        void OnStart45()
        {
            if (rt.PtrSet("/materials/12/extensions/KHR_materials_ior/ior", "float", 3.0))
            {
                if ((double)rt.PtrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").Value == 3.0)
                {
                    if (rt.PtrSet("/nodes/291/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior = (double)rt.PtrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").Value == 3.0;
                        rt.Log("<pointer/set and get - KHR_materials_ior/ior>: Test Successful");
                        proc866();
                    }
                }
                else
                {
                    proc866();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/12/extensions/KHR_materials_ior/ior with 3 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_ior/ior>: Test Failed");
            }
        }
        rt.OnStart(OnStart45);
        void OnStart46()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float", 1.2))
            {
                if ((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").Value == 1.2)
                {
                    if (rt.PtrSet("/nodes/298/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").Value == 1.2;
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Test Successful");
                        proc881();
                    }
                }
                else
                {
                    proc881();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceFactor with 1,2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart46);
        void OnStart47()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float", 2.3))
            {
                if ((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").Value == 2.3)
                {
                    if (rt.PtrSet("/nodes/304/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").Value == 2.3;
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Test Successful");
                        proc896();
                    }
                }
                else
                {
                    proc896();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceIor with 2,3 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Test Failed");
            }
        }
        rt.OnStart(OnStart47);
        void OnStart48()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float", 0.5))
            {
                if ((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").Value == 0.5)
                {
                    if (rt.PtrSet("/nodes/310/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").Value == 0.5;
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Test Successful");
                        proc911();
                    }
                }
                else
                {
                    proc911();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum with 0,5 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Test Failed");
            }
        }
        rt.OnStart(OnStart48);
        void OnStart49()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float", 1.2))
            {
                if ((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").Value == 1.2)
                {
                    if (rt.PtrSet("/nodes/316/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = (double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").Value == 1.2;
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Test Successful");
                        proc926();
                    }
                }
                else
                {
                    proc926();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum with 1,2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Test Failed");
            }
        }
        rt.OnStart(OnStart49);
        void OnStart50()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/322/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Test Successful");
                        proc941();
                    }
                }
                else
                {
                    proc941();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart50);
        void OnStart51()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/328/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Test Successful");
                        proc958();
                    }
                }
                else
                {
                    proc958();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart51);
        void OnStart52()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/334/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Test Successful");
                        proc973();
                    }
                }
                else
                {
                    proc973();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart52);
        void OnStart53()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/340/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Test Successful");
                        proc988();
                    }
                }
                else
                {
                    proc988();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart53);
        void OnStart54()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/346/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Test Successful");
                        proc1005();
                    }
                }
                else
                {
                    proc1005();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart54);
        void OnStart55()
        {
            if (rt.PtrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/352/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Test Successful");
                        proc1020();
                    }
                }
                else
                {
                    proc1020();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart55);
        void OnStart56()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3", new double[] { 0.0, 0.0, 1.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").Value, new double[] { 0.0, 0.0, 1.0 }))
                {
                    if (rt.PtrSet("/nodes/359/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").Value, new double[] { 0.0, 0.0, 1.0 });
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Test Successful");
                        proc1035();
                    }
                }
                else
                {
                    proc1035();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorFactor with (0.00, 0.00, 1.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart56);
        void OnStart57()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float", 2.3))
            {
                if ((double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").Value == 2.3)
                {
                    if (rt.PtrSet("/nodes/365/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = (double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").Value == 2.3;
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Test Successful");
                        proc1050();
                    }
                }
                else
                {
                    proc1050();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor with 2,3 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart57);
        void OnStart58()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/371/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Test Successful");
                        proc1065();
                    }
                }
                else
                {
                    proc1065();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart58);
        void OnStart59()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/377/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Test Successful");
                        proc1082();
                    }
                }
                else
                {
                    proc1082();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart59);
        void OnStart60()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/383/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Test Successful");
                        proc1097();
                    }
                }
                else
                {
                    proc1097();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart60);
        void OnStart61()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/389/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Test Successful");
                        proc1112();
                    }
                }
                else
                {
                    proc1112();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart61);
        void OnStart62()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/395/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Test Successful");
                        proc1129();
                    }
                }
                else
                {
                    proc1129();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart62);
        void OnStart63()
        {
            if (rt.PtrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/401/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Test Successful");
                        proc1144();
                    }
                }
                else
                {
                    proc1144();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart63);
        void OnStart64()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float", 1.2))
            {
                if ((double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").Value == 1.2)
                {
                    if (rt.PtrSet("/nodes/408/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor = (double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").Value == 1.2;
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularFactor>: Test Successful");
                        proc1159();
                    }
                }
                else
                {
                    proc1159();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularFactor with 1,2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart64);
        void OnStart65()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3", new double[] { 1.0, 0.0, 0.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").Value, new double[] { 1.0, 0.0, 0.0 }))
                {
                    if (rt.PtrSet("/nodes/414/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor = M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").Value, new double[] { 1.0, 0.0, 0.0 });
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Test Successful");
                        proc1174();
                    }
                }
                else
                {
                    proc1174();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorFactor with (1.00, 0.00, 0.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart65);
        void OnStart66()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/420/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Test Successful");
                        proc1189();
                    }
                }
                else
                {
                    proc1189();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart66);
        void OnStart67()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/426/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Test Successful");
                        proc1206();
                    }
                }
                else
                {
                    proc1206();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart67);
        void OnStart68()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/432/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Test Successful");
                        proc1221();
                    }
                }
                else
                {
                    proc1221();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart68);
        void OnStart69()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/438/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Test Successful");
                        proc1236();
                    }
                }
                else
                {
                    proc1236();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart69);
        void OnStart70()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/444/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Test Successful");
                        proc1253();
                    }
                }
                else
                {
                    proc1253();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart70);
        void OnStart71()
        {
            if (rt.PtrSet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/450/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Test Successful");
                        proc1268();
                    }
                }
                else
                {
                    proc1268();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart71);
        void OnStart72()
        {
            if (rt.PtrSet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float", 1.2))
            {
                if ((double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").Value == 1.2)
                {
                    if (rt.PtrSet("/nodes/457/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = (double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").Value == 1.2;
                        rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Test Successful");
                        proc1283();
                    }
                }
                else
                {
                    proc1283();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionFactor with 1,2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart72);
        void OnStart73()
        {
            if (rt.PtrSet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/463/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Test Successful");
                        proc1298();
                    }
                }
                else
                {
                    proc1298();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart73);
        void OnStart74()
        {
            if (rt.PtrSet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/469/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Test Successful");
                        proc1315();
                    }
                }
                else
                {
                    proc1315();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart74);
        void OnStart75()
        {
            if (rt.PtrSet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/475/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Test Successful");
                        proc1330();
                    }
                }
                else
                {
                    proc1330();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart75);
        void OnStart76()
        {
            if (rt.PtrSet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float", 1.2))
            {
                if ((double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").Value == 1.2)
                {
                    if (rt.PtrSet("/nodes/482/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor = (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").Value == 1.2;
                        rt.Log("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Test Successful");
                        proc1345();
                    }
                }
                else
                {
                    proc1345();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessFactor with 1,2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessFactor>: Test Failed");
            }
        }
        rt.OnStart(OnStart76);
        void OnStart77()
        {
            if (rt.PtrSet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float", 2.2))
            {
                if ((double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").Value == 2.2)
                {
                    if (rt.PtrSet("/nodes/488/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance = (double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").Value == 2.2;
                        rt.Log("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Test Successful");
                        proc1360();
                    }
                }
                else
                {
                    proc1360();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationDistance with 2,2 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_volume/attenuationDistance>: Test Failed");
            }
        }
        rt.OnStart(OnStart77);
        void OnStart78()
        {
            if (rt.PtrSet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3", new double[] { 1.0, 0.0, 0.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").Value, new double[] { 1.0, 0.0, 0.0 }))
                {
                    if (rt.PtrSet("/nodes/494/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor = M.Eq((double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").Value, new double[] { 1.0, 0.0, 0.0 });
                        rt.Log("<pointer/set and get - KHR_materials_volume/attenuationColor>: Test Successful");
                        proc1375();
                    }
                }
                else
                {
                    proc1375();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationColor with (1.00, 0.00, 0.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_volume/attenuationColor>: Test Failed");
            }
        }
        rt.OnStart(OnStart78);
        void OnStart79()
        {
            if (rt.PtrSet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/500/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = M.Eq((double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Test Successful");
                        proc1390();
                    }
                }
                else
                {
                    proc1390();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Test Failed");
            }
        }
        rt.OnStart(OnStart79);
        void OnStart80()
        {
            if (rt.PtrSet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982))
            {
                if (M.Abs((double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001)
                {
                    if (rt.PtrSet("/nodes/506/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = M.Abs((double)rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").Value - 0.7853982) < 0.0001;
                        rt.Log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Test Successful");
                        proc1407();
                    }
                }
                else
                {
                    proc1407();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Test Failed");
            }
        }
        rt.OnStart(OnStart80);
        void OnStart81()
        {
            if (rt.PtrSet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2", new double[] { 2.0, 3.0 }))
            {
                if (M.Eq((double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 }))
                {
                    if (rt.PtrSet("/nodes/512/translation", "float3", new double[] { 0.0, 0.0, 0.8 }))
                    {
                        V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = M.Eq((double[])rt.PtrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").Value, new double[] { 2.0, 3.0 });
                        rt.Log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Test Successful");
                        proc1422();
                    }
                }
                else
                {
                    proc1422();
                }
            }
            else
            {
                rt.Log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
            }
            if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale)
            {
                rt.Log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Test Failed");
            }
        }
        rt.OnStart(OnStart81);
        void OnStart82()
        {
            rt.Send(Events.test_onStart);
            if (V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff && V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor && V.TestResult_HasPassed_pointer_set_and_get__metallicFactor && V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor && V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale)
            {
                rt.Send(Events.test_onSuccess);
            }
            else
            {
                rt.Send(Events.test_onFailed);
            }
        }
        rt.OnStart(OnStart82);
    }
}
