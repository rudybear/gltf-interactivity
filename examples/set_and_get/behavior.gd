extends RefCounted

var m
var rt
var V
var E

func build(_rt) -> void:
    rt = _rt
    V = rt.vars([["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle"], ["TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle"], ["TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle", rt.float_var(-0.0142), "TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle"], ["TestResult_HasPassed_pointer_set_and_get__alphaCutoff", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/alphaCutoff"], ["TestResult_pointer_set_and_get__alphaCutoff", rt.float_var(-0.0142), "TestResult_pointer/set and get_/alphaCutoff"], ["TestResult_HasPassed_pointer_set_and_get__emissiveFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/emissiveFactor"], ["TestResult_pointer_set_and_get__emissiveFactor", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_pointer/set and get_/emissiveFactor"], ["TestResult_HasPassed_pointer_set_and_get__normalTexture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/normalTexture/scale"], ["TestResult_pointer_set_and_get__normalTexture_scale", rt.float_var(-0.0142), "TestResult_pointer/set and get_/normalTexture/scale"], ["TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/occlusionTexture/strength"], ["TestResult_pointer_set_and_get__occlusionTexture_strength", rt.float_var(-0.0142), "TestResult_pointer/set and get_/occlusionTexture/strength"], ["TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/normalTexture texture offset"], ["TestResult_pointer_set_and_get__normalTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/normalTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/normalTexture texture rotation"], ["TestResult_pointer_set_and_get__normalTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_/normalTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/normalTexture texture scale"], ["TestResult_pointer_set_and_get__normalTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/normalTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/occlusionTexture texture offset"], ["TestResult_pointer_set_and_get__occlusionTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/occlusionTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/occlusionTexture texture rotation"], ["TestResult_pointer_set_and_get__occlusionTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_/occlusionTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/occlusionTexture texture scale"], ["TestResult_pointer_set_and_get__occlusionTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/occlusionTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/emissiveTexture texture offset"], ["TestResult_pointer_set_and_get__emissiveTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/emissiveTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/emissiveTexture texture rotation"], ["TestResult_pointer_set_and_get__emissiveTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_/emissiveTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/emissiveTexture texture scale"], ["TestResult_pointer_set_and_get__emissiveTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/emissiveTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get__baseColorFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/baseColorFactor"], ["TestResult_pointer_set_and_get__baseColorFactor", rt.float4(-0.0142, -0.0142, -0.0142, 0.0), "TestResult_pointer/set and get_/baseColorFactor"], ["TestResult_HasPassed_pointer_set_and_get__metallicFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/metallicFactor"], ["TestResult_pointer_set_and_get__metallicFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_/metallicFactor"], ["TestResult_HasPassed_pointer_set_and_get__roughnessFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/roughnessFactor"], ["TestResult_pointer_set_and_get__roughnessFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_/roughnessFactor"], ["TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/baseColorTexture texture offset"], ["TestResult_pointer_set_and_get__baseColorTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/baseColorTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/baseColorTexture texture rotation"], ["TestResult_pointer_set_and_get__baseColorTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_/baseColorTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/baseColorTexture texture scale"], ["TestResult_pointer_set_and_get__baseColorTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/baseColorTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture offset"], ["TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/metallicRoughnessTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture rotation"], ["TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_/metallicRoughnessTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture scale"], ["TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_/metallicRoughnessTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength"], ["TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation"], ["TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_dispersion/dispersion"], ["TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_dispersion/dispersion"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength"], ["TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_ior/ior"], ["TestResult_pointer_set_and_get_KHR_materials_ior_ior", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_ior/ior"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceFactor"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceIor"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceIor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorFactor"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularFactor"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorFactor"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularColorFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionFactor"], ["TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_transmission/transmissionFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessFactor"], ["TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_volume/thicknessFactor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationDistance"], ["TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_volume/attenuationDistance"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationColor"], ["TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor", rt.float3(-0.0142, -0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_volume/attenuationColor"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset"], ["TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation"], ["TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation", rt.float_var(-0.0142), "TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation"], ["TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale", rt.bool_var(false), "TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale"], ["TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale", rt.float2(-0.0142, -0.0142), "TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale"]])
    E = rt.events([["test_onStart", {"externalId": "test/onStart", "expectedDuration": 0.0}], ["test_onSuccess", {"externalId": "test/onSuccess"}], ["test_onFailed", {"externalId": "test/onFailed"}]])
    rt.on_start(__on_start_0)
    rt.on_start(__on_start_1)
    rt.on_start(__on_start_2)
    rt.on_start(__on_start_3)
    rt.on_start(__on_start_4)
    rt.on_start(__on_start_5)
    rt.on_start(__on_start_6)
    rt.on_start(__on_start_7)
    rt.on_start(__on_start_8)
    rt.on_start(__on_start_9)
    rt.on_start(__on_start_10)
    rt.on_start(__on_start_11)
    rt.on_start(__on_start_12)
    rt.on_start(__on_start_13)
    rt.on_start(__on_start_14)
    rt.on_start(__on_start_15)
    rt.on_start(__on_start_16)
    rt.on_start(__on_start_17)
    rt.on_start(__on_start_18)
    rt.on_start(__on_start_19)
    rt.on_start(__on_start_20)
    rt.on_start(__on_start_21)
    rt.on_start(__on_start_22)
    rt.on_start(__on_start_23)
    rt.on_start(__on_start_24)
    rt.on_start(__on_start_25)
    rt.on_start(__on_start_26)
    rt.on_start(__on_start_27)
    rt.on_start(__on_start_28)
    rt.on_start(__on_start_29)
    rt.on_start(__on_start_30)
    rt.on_start(__on_start_31)
    rt.on_start(__on_start_32)
    rt.on_start(__on_start_33)
    rt.on_start(__on_start_34)
    rt.on_start(__on_start_35)
    rt.on_start(__on_start_36)
    rt.on_start(__on_start_37)
    rt.on_start(__on_start_38)
    rt.on_start(__on_start_39)
    rt.on_start(__on_start_40)
    rt.on_start(__on_start_41)
    rt.on_start(__on_start_42)
    rt.on_start(__on_start_43)
    rt.on_start(__on_start_44)
    rt.on_start(__on_start_45)
    rt.on_start(__on_start_46)
    rt.on_start(__on_start_47)
    rt.on_start(__on_start_48)
    rt.on_start(__on_start_49)
    rt.on_start(__on_start_50)
    rt.on_start(__on_start_51)
    rt.on_start(__on_start_52)
    rt.on_start(__on_start_53)
    rt.on_start(__on_start_54)
    rt.on_start(__on_start_55)
    rt.on_start(__on_start_56)
    rt.on_start(__on_start_57)
    rt.on_start(__on_start_58)
    rt.on_start(__on_start_59)
    rt.on_start(__on_start_60)
    rt.on_start(__on_start_61)
    rt.on_start(__on_start_62)
    rt.on_start(__on_start_63)
    rt.on_start(__on_start_64)
    rt.on_start(__on_start_65)
    rt.on_start(__on_start_66)
    rt.on_start(__on_start_67)
    rt.on_start(__on_start_68)
    rt.on_start(__on_start_69)
    rt.on_start(__on_start_70)
    rt.on_start(__on_start_71)
    rt.on_start(__on_start_72)
    rt.on_start(__on_start_73)
    rt.on_start(__on_start_74)
    rt.on_start(__on_start_75)
    rt.on_start(__on_start_76)
    rt.on_start(__on_start_77)
    rt.on_start(__on_start_78)
    rt.on_start(__on_start_79)
    rt.on_start(__on_start_80)
    rt.on_start(__on_start_81)
    rt.on_start(__on_start_82)

func proc7() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/0/color", "float3")["value"], [1.0, 0.0, 0.0]])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = rt.ptr_get("/extensions/KHR_lights_punctual/lights/0/color", "float3")["value"]

func proc23() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/1/intensity", "float")["value"], 4.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = rt.ptr_get("/extensions/KHR_lights_punctual/lights/1/intensity", "float")["value"]

func proc39() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/2/range", "float")["value"], 9.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = rt.ptr_get("/extensions/KHR_lights_punctual/lights/2/range", "float")["value"]

func proc218() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float")["value"], 2.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float")["value"]

func proc233() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float")["value"], 5.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float")["value"]

func proc248() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/color", {"lightRef": "/extensions/KHR_lights_punctual/lights/5"}, "float3")["value"], [1.0, 0.0, 0.0]])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/color", {"lightRef": "/extensions/KHR_lights_punctual/lights/5"}, "float3")["value"]

func proc263() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", {"lightRef": "/extensions/KHR_lights_punctual/lights/6"}, "float")["value"], 4.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", {"lightRef": "/extensions/KHR_lights_punctual/lights/6"}, "float")["value"]

func proc278() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/range", {"lightRef": "/extensions/KHR_lights_punctual/lights/7"}, "float")["value"], 9.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/range", {"lightRef": "/extensions/KHR_lights_punctual/lights/7"}, "float")["value"]

func proc293() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/8"}, "float")["value"], 2.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/8"}, "float")["value"]

func proc308() -> void:
    rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Value is {0}, should be {1} ", [rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/9"}, "float")["value"], 5.0])
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/9"}, "float")["value"]

func proc323() -> void:
    rt.log_msg("<pointer/set and get - /alphaCutoff>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/alphaCutoff", "float")["value"], 0.5])
    V.TestResult_pointer_set_and_get__alphaCutoff = rt.ptr_get("/materials/6/alphaCutoff", "float")["value"]

func proc338() -> void:
    rt.log_msg("<pointer/set and get - /emissiveFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/emissiveFactor", "float3")["value"], [1.0, 0.0, 0.0]])
    V.TestResult_pointer_set_and_get__emissiveFactor = rt.ptr_get("/materials/6/emissiveFactor", "float3")["value"]

func proc353() -> void:
    rt.log_msg("<pointer/set and get - /normalTexture/scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/normalTexture/scale", "float")["value"], 0.5])
    V.TestResult_pointer_set_and_get__normalTexture_scale = rt.ptr_get("/materials/6/normalTexture/scale", "float")["value"]

func proc368() -> void:
    rt.log_msg("<pointer/set and get - /occlusionTexture/strength>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/occlusionTexture/strength", "float")["value"], 0.5])
    V.TestResult_pointer_set_and_get__occlusionTexture_strength = rt.ptr_get("/materials/6/occlusionTexture/strength", "float")["value"]

func proc383() -> void:
    rt.log_msg("<pointer/set and get - /normalTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__normalTexture_texture_offset = rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc400() -> void:
    rt.log_msg("<pointer/set and get - /normalTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get__normalTexture_texture_rotation = rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc415() -> void:
    rt.log_msg("<pointer/set and get - /normalTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__normalTexture_texture_scale = rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc430() -> void:
    rt.log_msg("<pointer/set and get - /occlusionTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_offset = rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc447() -> void:
    rt.log_msg("<pointer/set and get - /occlusionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_rotation = rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc462() -> void:
    rt.log_msg("<pointer/set and get - /occlusionTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_scale = rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc477() -> void:
    rt.log_msg("<pointer/set and get - /emissiveTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_offset = rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc494() -> void:
    rt.log_msg("<pointer/set and get - /emissiveTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_rotation = rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc509() -> void:
    rt.log_msg("<pointer/set and get - /emissiveTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_scale = rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc524() -> void:
    rt.log_msg("<pointer/set and get - /baseColorFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4")["value"], [0.0, 0.0, 1.0, 1.0]])
    V.TestResult_pointer_set_and_get__baseColorFactor = rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4")["value"]

func proc539() -> void:
    rt.log_msg("<pointer/set and get - /metallicFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicFactor", "float")["value"], 0.5])
    V.TestResult_pointer_set_and_get__metallicFactor = rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicFactor", "float")["value"]

func proc554() -> void:
    rt.log_msg("<pointer/set and get - /roughnessFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/roughnessFactor", "float")["value"], 0.5])
    V.TestResult_pointer_set_and_get__roughnessFactor = rt.ptr_get("/materials/7/pbrMetallicRoughness/roughnessFactor", "float")["value"]

func proc569() -> void:
    rt.log_msg("<pointer/set and get - /baseColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_offset = rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc586() -> void:
    rt.log_msg("<pointer/set and get - /baseColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_rotation = rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc601() -> void:
    rt.log_msg("<pointer/set and get - /baseColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_scale = rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc616() -> void:
    rt.log_msg("<pointer/set and get - /metallicRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset = rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc633() -> void:
    rt.log_msg("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc648() -> void:
    rt.log_msg("<pointer/set and get - /metallicRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale = rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc663() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float")["value"], 2.0])
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float")["value"]

func proc680() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float")["value"], 0.5235988])
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float")["value"]

func proc695() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc712() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc727() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc742() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc759() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc774() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc789() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc806() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc821() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc836() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_dispersion/dispersion>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float")["value"], 2.0])
    V.TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion = rt.ptr_get("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float")["value"]

func proc851() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float")["value"], 2.0])
    V.TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = rt.ptr_get("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float")["value"]

func proc866() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_ior/ior>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/12/extensions/KHR_materials_ior/ior", "float")["value"], 3.0])
    V.TestResult_pointer_set_and_get_KHR_materials_ior_ior = rt.ptr_get("/materials/12/extensions/KHR_materials_ior/ior", "float")["value"]

func proc881() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float")["value"], 1.2])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float")["value"]

func proc896() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float")["value"], 2.3])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float")["value"]

func proc911() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float")["value"], 0.5])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float")["value"]

func proc926() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float")["value"], 1.2])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float")["value"]

func proc941() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc958() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc973() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc988() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1005() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1020() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc1035() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3")["value"], [0.0, 0.0, 1.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3")["value"]

func proc1050() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float")["value"], 2.3])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float")["value"]

func proc1065() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1082() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1097() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc1112() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1129() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1144() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc1159() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularFactor", "float")["value"], 1.2])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularFactor", "float")["value"]

func proc1174() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3")["value"], [1.0, 0.0, 0.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3")["value"]

func proc1189() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1206() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1221() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc1236() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1253() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1268() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc1283() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float")["value"], 1.2])
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float")["value"]

func proc1298() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1315() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1330() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func proc1345() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float")["value"], 1.2])
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float")["value"]

func proc1360() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float")["value"], 2.2])
    V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float")["value"]

func proc1375() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_volume/attenuationColor>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3")["value"], [1.0, 0.0, 0.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3")["value"]

func proc1390() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"]

func proc1407() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"], 0.7853982])
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"]

func proc1422() -> void:
    rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]])
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"]

func __on_start_0() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/0/color", "float3", [1.0, 0.0, 0.0]):
        if m.eq(rt.ptr_get("/extensions/KHR_lights_punctual/lights/0/color", "float3")["value"], [1.0, 0.0, 0.0]):
            if rt.ptr_set("/nodes/5/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = m.eq(rt.ptr_get("/extensions/KHR_lights_punctual/lights/0/color", "float3")["value"], [1.0, 0.0, 0.0])
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Successful")
                proc7()
        else:
            proc7()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/0/color with (1.00, 0.00, 0.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Failed")

func __on_start_1() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/1/intensity", "float", 4.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/1/intensity", "float")["value"] == 4.0:
            if rt.ptr_set("/nodes/12/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = rt.ptr_get("/extensions/KHR_lights_punctual/lights/1/intensity", "float")["value"] == 4.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Test Successful")
                proc23()
        else:
            proc23()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/1/intensity with 4 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Test Failed")

func __on_start_2() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/2/range", "float", 9.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/2/range", "float")["value"] == 9.0:
            if rt.ptr_set("/nodes/19/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = rt.ptr_get("/extensions/KHR_lights_punctual/lights/2/range", "float")["value"] == 9.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Test Successful")
                proc39()
        else:
            proc39()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/2/range with 9 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Test Failed")

func __on_start_3() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float", 2.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float")["value"] == 2.0:
            if rt.ptr_set("/nodes/26/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float")["value"] == 2.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Test Successful")
                proc218()
        else:
            proc218()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle with 2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Test Failed")

func __on_start_4() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float", 5.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float")["value"] == 5.0:
            if rt.ptr_set("/nodes/33/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float")["value"] == 5.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Test Successful")
                proc233()
        else:
            proc233()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle with 5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Test Failed")

func __on_start_5() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/{lightRef}/color", {"lightRef": "/extensions/KHR_lights_punctual/lights/5"}, "float3", [1.0, 0.0, 0.0]):
        if m.eq(rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/color", {"lightRef": "/extensions/KHR_lights_punctual/lights/5"}, "float3")["value"], [1.0, 0.0, 0.0]):
            if rt.ptr_set("/nodes/40/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = m.eq(rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/color", {"lightRef": "/extensions/KHR_lights_punctual/lights/5"}, "float3")["value"], [1.0, 0.0, 0.0])
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Test Successful")
                proc248()
        else:
            proc248()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/5/color with (1.00, 0.00, 0.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Test Failed")

func __on_start_6() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", {"lightRef": "/extensions/KHR_lights_punctual/lights/6"}, "float", 4.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", {"lightRef": "/extensions/KHR_lights_punctual/lights/6"}, "float")["value"] == 4.0:
            if rt.ptr_set("/nodes/47/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", {"lightRef": "/extensions/KHR_lights_punctual/lights/6"}, "float")["value"] == 4.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Test Successful")
                proc263()
        else:
            proc263()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/6/intensity with 4 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Test Failed")

func __on_start_7() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/{lightRef}/range", {"lightRef": "/extensions/KHR_lights_punctual/lights/7"}, "float", 9.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/range", {"lightRef": "/extensions/KHR_lights_punctual/lights/7"}, "float")["value"] == 9.0:
            if rt.ptr_set("/nodes/54/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/range", {"lightRef": "/extensions/KHR_lights_punctual/lights/7"}, "float")["value"] == 9.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Test Successful")
                proc278()
        else:
            proc278()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/7/range with 9 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Test Failed")

func __on_start_8() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/8"}, "float", 2.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/8"}, "float")["value"] == 2.0:
            if rt.ptr_set("/nodes/61/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/8"}, "float")["value"] == 2.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Test Successful")
                proc293()
        else:
            proc293()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/8/spot/innerConeAngle with 2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Test Failed")

func __on_start_9() -> void:
    if rt.ptr_set("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/9"}, "float", 5.0):
        if rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/9"}, "float")["value"] == 5.0:
            if rt.ptr_set("/nodes/68/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = rt.ptr_get("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", {"lightRef": "/extensions/KHR_lights_punctual/lights/9"}, "float")["value"] == 5.0
                rt.log_msg("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Test Successful")
                proc308()
        else:
            proc308()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/9/spot/outerConeAngle with 5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle:
        rt.log_msg("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Test Failed")

func __on_start_10() -> void:
    if rt.ptr_set("/materials/6/alphaCutoff", "float", 0.5):
        if rt.ptr_get("/materials/6/alphaCutoff", "float")["value"] == 0.5:
            if rt.ptr_set("/nodes/75/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff = rt.ptr_get("/materials/6/alphaCutoff", "float")["value"] == 0.5
                rt.log_msg("<pointer/set and get - /alphaCutoff>: Test Successful")
                proc323()
        else:
            proc323()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/alphaCutoff with 0,5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff:
        rt.log_msg("ERROR! <pointer/set and get - /alphaCutoff>: Test Failed")

func __on_start_11() -> void:
    if rt.ptr_set("/materials/6/emissiveFactor", "float3", [1.0, 0.0, 0.0]):
        if m.eq(rt.ptr_get("/materials/6/emissiveFactor", "float3")["value"], [1.0, 0.0, 0.0]):
            if rt.ptr_set("/nodes/81/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor = m.eq(rt.ptr_get("/materials/6/emissiveFactor", "float3")["value"], [1.0, 0.0, 0.0])
                rt.log_msg("<pointer/set and get - /emissiveFactor>: Test Successful")
                proc338()
        else:
            proc338()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveFactor with (1.00, 0.00, 0.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor:
        rt.log_msg("ERROR! <pointer/set and get - /emissiveFactor>: Test Failed")

func __on_start_12() -> void:
    if rt.ptr_set("/materials/6/normalTexture/scale", "float", 0.5):
        if rt.ptr_get("/materials/6/normalTexture/scale", "float")["value"] == 0.5:
            if rt.ptr_set("/nodes/87/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale = rt.ptr_get("/materials/6/normalTexture/scale", "float")["value"] == 0.5
                rt.log_msg("<pointer/set and get - /normalTexture/scale>: Test Successful")
                proc353()
        else:
            proc353()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/scale with 0,5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale:
        rt.log_msg("ERROR! <pointer/set and get - /normalTexture/scale>: Test Failed")

func __on_start_13() -> void:
    if rt.ptr_set("/materials/6/occlusionTexture/strength", "float", 0.5):
        if rt.ptr_get("/materials/6/occlusionTexture/strength", "float")["value"] == 0.5:
            if rt.ptr_set("/nodes/93/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength = rt.ptr_get("/materials/6/occlusionTexture/strength", "float")["value"] == 0.5
                rt.log_msg("<pointer/set and get - /occlusionTexture/strength>: Test Successful")
                proc368()
        else:
            proc368()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/strength with 0,5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength:
        rt.log_msg("ERROR! <pointer/set and get - /occlusionTexture/strength>: Test Failed")

func __on_start_14() -> void:
    if rt.ptr_set("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/99/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset = m.eq(rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /normalTexture texture offset>: Test Successful")
                proc383()
        else:
            proc383()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - /normalTexture texture offset>: Test Failed")

func __on_start_15() -> void:
    if rt.ptr_set("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/105/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - /normalTexture texture rotation>: Test Successful")
                proc400()
        else:
            proc400()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - /normalTexture texture rotation>: Test Failed")

func __on_start_16() -> void:
    if rt.ptr_set("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/111/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale = m.eq(rt.ptr_get("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /normalTexture texture scale>: Test Successful")
                proc415()
        else:
            proc415()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - /normalTexture texture scale>: Test Failed")

func __on_start_17() -> void:
    if rt.ptr_set("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/117/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset = m.eq(rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /occlusionTexture texture offset>: Test Successful")
                proc430()
        else:
            proc430()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - /occlusionTexture texture offset>: Test Failed")

func __on_start_18() -> void:
    if rt.ptr_set("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/123/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - /occlusionTexture texture rotation>: Test Successful")
                proc447()
        else:
            proc447()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - /occlusionTexture texture rotation>: Test Failed")

func __on_start_19() -> void:
    if rt.ptr_set("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/129/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale = m.eq(rt.ptr_get("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /occlusionTexture texture scale>: Test Successful")
                proc462()
        else:
            proc462()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - /occlusionTexture texture scale>: Test Failed")

func __on_start_20() -> void:
    if rt.ptr_set("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/135/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset = m.eq(rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /emissiveTexture texture offset>: Test Successful")
                proc477()
        else:
            proc477()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - /emissiveTexture texture offset>: Test Failed")

func __on_start_21() -> void:
    if rt.ptr_set("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/141/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - /emissiveTexture texture rotation>: Test Successful")
                proc494()
        else:
            proc494()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - /emissiveTexture texture rotation>: Test Failed")

func __on_start_22() -> void:
    if rt.ptr_set("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/147/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale = m.eq(rt.ptr_get("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /emissiveTexture texture scale>: Test Successful")
                proc509()
        else:
            proc509()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - /emissiveTexture texture scale>: Test Failed")

func __on_start_23() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4", [0.0, 0.0, 1.0, 1.0]):
        if m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4")["value"], [0.0, 0.0, 1.0, 1.0]):
            if rt.ptr_set("/nodes/154/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor = m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4")["value"], [0.0, 0.0, 1.0, 1.0])
                rt.log_msg("<pointer/set and get - /baseColorFactor>: Test Successful")
                proc524()
        else:
            proc524()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorFactor with RGBA(0.000, 0.000, 1.000, 1.000) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor:
        rt.log_msg("ERROR! <pointer/set and get - /baseColorFactor>: Test Failed")

func __on_start_24() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/metallicFactor", "float", 0.5):
        if rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicFactor", "float")["value"] == 0.5:
            if rt.ptr_set("/nodes/160/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__metallicFactor = rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicFactor", "float")["value"] == 0.5
                rt.log_msg("<pointer/set and get - /metallicFactor>: Test Successful")
                proc539()
        else:
            proc539()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicFactor with 0,5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__metallicFactor:
        rt.log_msg("ERROR! <pointer/set and get - /metallicFactor>: Test Failed")

func __on_start_25() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/roughnessFactor", "float", 0.5):
        if rt.ptr_get("/materials/7/pbrMetallicRoughness/roughnessFactor", "float")["value"] == 0.5:
            if rt.ptr_set("/nodes/166/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor = rt.ptr_get("/materials/7/pbrMetallicRoughness/roughnessFactor", "float")["value"] == 0.5
                rt.log_msg("<pointer/set and get - /roughnessFactor>: Test Successful")
                proc554()
        else:
            proc554()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/roughnessFactor with 0,5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor:
        rt.log_msg("ERROR! <pointer/set and get - /roughnessFactor>: Test Failed")

func __on_start_26() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/172/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset = m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /baseColorTexture texture offset>: Test Successful")
                proc569()
        else:
            proc569()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - /baseColorTexture texture offset>: Test Failed")

func __on_start_27() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/178/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - /baseColorTexture texture rotation>: Test Successful")
                proc586()
        else:
            proc586()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - /baseColorTexture texture rotation>: Test Failed")

func __on_start_28() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/184/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale = m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /baseColorTexture texture scale>: Test Successful")
                proc601()
        else:
            proc601()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - /baseColorTexture texture scale>: Test Failed")

func __on_start_29() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/190/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset = m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /metallicRoughnessTexture texture offset>: Test Successful")
                proc616()
        else:
            proc616()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - /metallicRoughnessTexture texture offset>: Test Failed")

func __on_start_30() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/196/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Test Successful")
                proc633()
        else:
            proc633()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - /metallicRoughnessTexture texture rotation>: Test Failed")

func __on_start_31() -> void:
    if rt.ptr_set("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/202/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale = m.eq(rt.ptr_get("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - /metallicRoughnessTexture texture scale>: Test Successful")
                proc648()
        else:
            proc648()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - /metallicRoughnessTexture texture scale>: Test Failed")

func __on_start_32() -> void:
    if rt.ptr_set("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float", 2.0):
        if rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float")["value"] == 2.0:
            if rt.ptr_set("/nodes/209/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float")["value"] == 2.0
                rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Test Successful")
                proc663()
        else:
            proc663()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength with 2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Test Failed")

func __on_start_33() -> void:
    if rt.ptr_set("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float", 0.5235988):
        if m.abs_(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float")["value"] - 0.5235988) < 0.0001:
            if rt.ptr_set("/nodes/215/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = m.abs_(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float")["value"] - 0.5235988) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Test Successful")
                proc680()
        else:
            proc680()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation with 0,5235988 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Test Failed")

func __on_start_34() -> void:
    if rt.ptr_set("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/221/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = m.eq(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Test Successful")
                proc695()
        else:
            proc695()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Test Failed")

func __on_start_35() -> void:
    if rt.ptr_set("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/227/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Test Successful")
                proc712()
        else:
            proc712()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Test Failed")

func __on_start_36() -> void:
    if rt.ptr_set("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/233/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = m.eq(rt.ptr_get("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Test Successful")
                proc727()
        else:
            proc727()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Test Failed")

func __on_start_37() -> void:
    if rt.ptr_set("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/240/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Test Successful")
                proc742()
        else:
            proc742()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Test Failed")

func __on_start_38() -> void:
    if rt.ptr_set("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/246/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Test Successful")
                proc759()
        else:
            proc759()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Test Failed")

func __on_start_39() -> void:
    if rt.ptr_set("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/252/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Test Successful")
                proc774()
        else:
            proc774()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Test Failed")

func __on_start_40() -> void:
    if rt.ptr_set("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/258/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Test Successful")
                proc789()
        else:
            proc789()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Test Failed")

func __on_start_41() -> void:
    if rt.ptr_set("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/264/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Test Successful")
                proc806()
        else:
            proc806()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Test Failed")

func __on_start_42() -> void:
    if rt.ptr_set("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/270/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = m.eq(rt.ptr_get("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Test Successful")
                proc821()
        else:
            proc821()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Test Failed")

func __on_start_43() -> void:
    if rt.ptr_set("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float", 2.0):
        if rt.ptr_get("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float")["value"] == 2.0:
            if rt.ptr_set("/nodes/277/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion = rt.ptr_get("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float")["value"] == 2.0
                rt.log_msg("<pointer/set and get - KHR_materials_dispersion/dispersion>: Test Successful")
                proc836()
        else:
            proc836()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/10/extensions/KHR_materials_dispersion/dispersion with 2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_dispersion/dispersion>: Test Failed")

func __on_start_44() -> void:
    if rt.ptr_set("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float", 2.0):
        if rt.ptr_get("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float")["value"] == 2.0:
            if rt.ptr_set("/nodes/284/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = rt.ptr_get("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float")["value"] == 2.0
                rt.log_msg("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Test Successful")
                proc851()
        else:
            proc851()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength with 2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Test Failed")

func __on_start_45() -> void:
    if rt.ptr_set("/materials/12/extensions/KHR_materials_ior/ior", "float", 3.0):
        if rt.ptr_get("/materials/12/extensions/KHR_materials_ior/ior", "float")["value"] == 3.0:
            if rt.ptr_set("/nodes/291/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior = rt.ptr_get("/materials/12/extensions/KHR_materials_ior/ior", "float")["value"] == 3.0
                rt.log_msg("<pointer/set and get - KHR_materials_ior/ior>: Test Successful")
                proc866()
        else:
            proc866()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/12/extensions/KHR_materials_ior/ior with 3 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_ior/ior>: Test Failed")

func __on_start_46() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float", 1.2):
        if rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float")["value"] == 1.2:
            if rt.ptr_set("/nodes/298/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float")["value"] == 1.2
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Test Successful")
                proc881()
        else:
            proc881()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceFactor with 1,2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Test Failed")

func __on_start_47() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float", 2.3):
        if rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float")["value"] == 2.3:
            if rt.ptr_set("/nodes/304/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float")["value"] == 2.3
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Test Successful")
                proc896()
        else:
            proc896()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceIor with 2,3 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Test Failed")

func __on_start_48() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float", 0.5):
        if rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float")["value"] == 0.5:
            if rt.ptr_set("/nodes/310/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float")["value"] == 0.5
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Test Successful")
                proc911()
        else:
            proc911()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum with 0,5 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Test Failed")

func __on_start_49() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float", 1.2):
        if rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float")["value"] == 1.2:
            if rt.ptr_set("/nodes/316/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float")["value"] == 1.2
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Test Successful")
                proc926()
        else:
            proc926()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum with 1,2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Test Failed")

func __on_start_50() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/322/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Test Successful")
                proc941()
        else:
            proc941()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Test Failed")

func __on_start_51() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/328/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Test Successful")
                proc958()
        else:
            proc958()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Test Failed")

func __on_start_52() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/334/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Test Successful")
                proc973()
        else:
            proc973()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Test Failed")

func __on_start_53() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/340/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Test Successful")
                proc988()
        else:
            proc988()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Test Failed")

func __on_start_54() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/346/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Test Successful")
                proc1005()
        else:
            proc1005()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Test Failed")

func __on_start_55() -> void:
    if rt.ptr_set("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/352/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = m.eq(rt.ptr_get("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Test Successful")
                proc1020()
        else:
            proc1020()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Test Failed")

func __on_start_56() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3", [0.0, 0.0, 1.0]):
        if m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3")["value"], [0.0, 0.0, 1.0]):
            if rt.ptr_set("/nodes/359/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3")["value"], [0.0, 0.0, 1.0])
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Test Successful")
                proc1035()
        else:
            proc1035()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorFactor with (0.00, 0.00, 1.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Test Failed")

func __on_start_57() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float", 2.3):
        if rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float")["value"] == 2.3:
            if rt.ptr_set("/nodes/365/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float")["value"] == 2.3
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Test Successful")
                proc1050()
        else:
            proc1050()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor with 2,3 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Test Failed")

func __on_start_58() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/371/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Test Successful")
                proc1065()
        else:
            proc1065()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Test Failed")

func __on_start_59() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/377/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Test Successful")
                proc1082()
        else:
            proc1082()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Test Failed")

func __on_start_60() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/383/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Test Successful")
                proc1097()
        else:
            proc1097()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Test Failed")

func __on_start_61() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/389/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Test Successful")
                proc1112()
        else:
            proc1112()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Test Failed")

func __on_start_62() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/395/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Test Successful")
                proc1129()
        else:
            proc1129()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Test Failed")

func __on_start_63() -> void:
    if rt.ptr_set("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/401/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = m.eq(rt.ptr_get("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Test Successful")
                proc1144()
        else:
            proc1144()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Test Failed")

func __on_start_64() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularFactor", "float", 1.2):
        if rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularFactor", "float")["value"] == 1.2:
            if rt.ptr_set("/nodes/408/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor = rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularFactor", "float")["value"] == 1.2
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularFactor>: Test Successful")
                proc1159()
        else:
            proc1159()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularFactor with 1,2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularFactor>: Test Failed")

func __on_start_65() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3", [1.0, 0.0, 0.0]):
        if m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3")["value"], [1.0, 0.0, 0.0]):
            if rt.ptr_set("/nodes/414/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor = m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3")["value"], [1.0, 0.0, 0.0])
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Test Successful")
                proc1174()
        else:
            proc1174()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorFactor with (1.00, 0.00, 0.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularColorFactor>: Test Failed")

func __on_start_66() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/420/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Test Successful")
                proc1189()
        else:
            proc1189()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Test Failed")

func __on_start_67() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/426/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Test Successful")
                proc1206()
        else:
            proc1206()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Test Failed")

func __on_start_68() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/432/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Test Successful")
                proc1221()
        else:
            proc1221()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Test Failed")

func __on_start_69() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/438/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Test Successful")
                proc1236()
        else:
            proc1236()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Test Failed")

func __on_start_70() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/444/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Test Successful")
                proc1253()
        else:
            proc1253()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Test Failed")

func __on_start_71() -> void:
    if rt.ptr_set("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/450/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = m.eq(rt.ptr_get("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Test Successful")
                proc1268()
        else:
            proc1268()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Test Failed")

func __on_start_72() -> void:
    if rt.ptr_set("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float", 1.2):
        if rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float")["value"] == 1.2:
            if rt.ptr_set("/nodes/457/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float")["value"] == 1.2
                rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Test Successful")
                proc1283()
        else:
            proc1283()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionFactor with 1,2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionFactor>: Test Failed")

func __on_start_73() -> void:
    if rt.ptr_set("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/463/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = m.eq(rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Test Successful")
                proc1298()
        else:
            proc1298()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Test Failed")

func __on_start_74() -> void:
    if rt.ptr_set("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/469/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Test Successful")
                proc1315()
        else:
            proc1315()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Test Failed")

func __on_start_75() -> void:
    if rt.ptr_set("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/475/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = m.eq(rt.ptr_get("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Test Successful")
                proc1330()
        else:
            proc1330()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Test Failed")

func __on_start_76() -> void:
    if rt.ptr_set("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float", 1.2):
        if rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float")["value"] == 1.2:
            if rt.ptr_set("/nodes/482/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float")["value"] == 1.2
                rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Test Successful")
                proc1345()
        else:
            proc1345()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessFactor with 1,2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_volume/thicknessFactor>: Test Failed")

func __on_start_77() -> void:
    if rt.ptr_set("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float", 2.2):
        if rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float")["value"] == 2.2:
            if rt.ptr_set("/nodes/488/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance = rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float")["value"] == 2.2
                rt.log_msg("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Test Successful")
                proc1360()
        else:
            proc1360()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationDistance with 2,2 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_volume/attenuationDistance>: Test Failed")

func __on_start_78() -> void:
    if rt.ptr_set("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3", [1.0, 0.0, 0.0]):
        if m.eq(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3")["value"], [1.0, 0.0, 0.0]):
            if rt.ptr_set("/nodes/494/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor = m.eq(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3")["value"], [1.0, 0.0, 0.0])
                rt.log_msg("<pointer/set and get - KHR_materials_volume/attenuationColor>: Test Successful")
                proc1375()
        else:
            proc1375()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationColor with (1.00, 0.00, 0.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_volume/attenuationColor>: Test Failed")

func __on_start_79() -> void:
    if rt.ptr_set("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/500/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = m.eq(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Test Successful")
                proc1390()
        else:
            proc1390()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Test Failed")

func __on_start_80() -> void:
    if rt.ptr_set("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982):
        if m.abs_(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001:
            if rt.ptr_set("/nodes/506/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = m.abs_(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float")["value"] - 0.7853982) < 0.0001
                rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Test Successful")
                proc1407()
        else:
            proc1407()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Test Failed")

func __on_start_81() -> void:
    if rt.ptr_set("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2", [2.0, 3.0]):
        if m.eq(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0]):
            if rt.ptr_set("/nodes/512/translation", "float3", [0.0, 0.0, 0.8]):
                V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = m.eq(rt.ptr_get("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2")["value"], [2.0, 3.0])
                rt.log_msg("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Test Successful")
                proc1422()
        else:
            proc1422()
    else:
        rt.log_msg("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.")
    if not V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale:
        rt.log_msg("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Test Failed")

func __on_start_82() -> void:
    rt.send(E["test_onStart"])
    if V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle and V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle and V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff and V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor and V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale and V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength and V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor and V.TestResult_HasPassed_pointer_set_and_get__metallicFactor and V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor and V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation and V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale:
        rt.send(E["test_onSuccess"])
    else:
        rt.send(E["test_onFailed"])

