import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__alphaCutoff: rt.withId("TestResult_HasPassed_pointer/set and get_/alphaCutoff", rt.bool(false)), TestResult_pointer_set_and_get__alphaCutoff: rt.withId("TestResult_pointer/set and get_/alphaCutoff", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveFactor", rt.bool(false)), TestResult_pointer_set_and_get__emissiveFactor: rt.withId("TestResult_pointer/set and get_/emissiveFactor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture/scale", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_scale: rt.withId("TestResult_pointer/set and get_/normalTexture/scale", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture/strength", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_strength: rt.withId("TestResult_pointer/set and get_/occlusionTexture/strength", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/normalTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/normalTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/normalTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/occlusionTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/occlusionTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/occlusionTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__emissiveTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/emissiveTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__emissiveTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/emissiveTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__emissiveTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/emissiveTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorFactor", rt.bool(false)), TestResult_pointer_set_and_get__baseColorFactor: rt.withId("TestResult_pointer/set and get_/baseColorFactor", rt.float4(-0.0142, -0.0142, -0.0142, 0)), TestResult_HasPassed_pointer_set_and_get__metallicFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicFactor", rt.bool(false)), TestResult_pointer_set_and_get__metallicFactor: rt.withId("TestResult_pointer/set and get_/metallicFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__roughnessFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/roughnessFactor", rt.bool(false)), TestResult_pointer_set_and_get__roughnessFactor: rt.withId("TestResult_pointer/set and get_/roughnessFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__baseColorTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/baseColorTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__baseColorTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/baseColorTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__baseColorTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/baseColorTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/metallicRoughnessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/metallicRoughnessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/metallicRoughnessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_dispersion/dispersion", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion: rt.withId("TestResult_pointer/set and get_KHR_materials_dispersion/dispersion", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength: rt.withId("TestResult_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_ior/ior", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_ior_ior: rt.withId("TestResult_pointer/set and get_KHR_materials_ior/ior", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceIor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceIor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorFactor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorFactor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationDistance", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/attenuationDistance", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationColor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/attenuationColor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale", rt.float2(-0.0142, -0.0142)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  function proc7() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value;
  }
  function proc23() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").value, 4]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = rt.ptrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").value;
  }
  function proc39() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").value, 9]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = rt.ptrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").value;
  }
  function proc218() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").value, 2]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").value;
  }
  function proc233() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").value, 5]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").value;
  }
  function proc248() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3").value;
  }
  function proc263() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float").value, 4]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float").value;
  }
  function proc278() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float").value, 9]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float").value;
  }
  function proc293() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float").value, 2]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float").value;
  }
  function proc308() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float").value, 5]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float").value;
  }
  function proc323() {
    rt.log("<pointer/set and get - /alphaCutoff>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/alphaCutoff", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__alphaCutoff = rt.ptrGet("/materials/6/alphaCutoff", "float").value;
  }
  function proc338() {
    rt.log("<pointer/set and get - /emissiveFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/emissiveFactor", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get__emissiveFactor = rt.ptrGet("/materials/6/emissiveFactor", "float3").value;
  }
  function proc353() {
    rt.log("<pointer/set and get - /normalTexture/scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/normalTexture/scale", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__normalTexture_scale = rt.ptrGet("/materials/6/normalTexture/scale", "float").value;
  }
  function proc368() {
    rt.log("<pointer/set and get - /occlusionTexture/strength>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/occlusionTexture/strength", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__occlusionTexture_strength = rt.ptrGet("/materials/6/occlusionTexture/strength", "float").value;
  }
  function proc383() {
    rt.log("<pointer/set and get - /normalTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__normalTexture_texture_offset = rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc400() {
    rt.log("<pointer/set and get - /normalTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__normalTexture_texture_rotation = rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc415() {
    rt.log("<pointer/set and get - /normalTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__normalTexture_texture_scale = rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc430() {
    rt.log("<pointer/set and get - /occlusionTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_offset = rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc447() {
    rt.log("<pointer/set and get - /occlusionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_rotation = rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc462() {
    rt.log("<pointer/set and get - /occlusionTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_scale = rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc477() {
    rt.log("<pointer/set and get - /emissiveTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_offset = rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc494() {
    rt.log("<pointer/set and get - /emissiveTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_rotation = rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc509() {
    rt.log("<pointer/set and get - /emissiveTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_scale = rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc524() {
    rt.log("<pointer/set and get - /baseColorFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").value, [0, 0, 1, 1]]);
    V.TestResult_pointer_set_and_get__baseColorFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").value;
  }
  function proc539() {
    rt.log("<pointer/set and get - /metallicFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__metallicFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").value;
  }
  function proc554() {
    rt.log("<pointer/set and get - /roughnessFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__roughnessFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").value;
  }
  function proc569() {
    rt.log("<pointer/set and get - /baseColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_offset = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc586() {
    rt.log("<pointer/set and get - /baseColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_rotation = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc601() {
    rt.log("<pointer/set and get - /baseColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_scale = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc616() {
    rt.log("<pointer/set and get - /metallicRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc633() {
    rt.log("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc648() {
    rt.log("<pointer/set and get - /metallicRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc663() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").value, 2]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").value;
  }
  function proc680() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").value, 0.5235988]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").value;
  }
  function proc695() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc712() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc727() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc742() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc759() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc774() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc789() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc806() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc821() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc836() {
    rt.log("<pointer/set and get - KHR_materials_dispersion/dispersion>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").value, 2]);
    V.TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion = rt.ptrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").value;
  }
  function proc851() {
    rt.log("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").value, 2]);
    V.TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = rt.ptrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").value;
  }
  function proc866() {
    rt.log("<pointer/set and get - KHR_materials_ior/ior>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").value, 3]);
    V.TestResult_pointer_set_and_get_KHR_materials_ior_ior = rt.ptrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").value;
  }
  function proc881() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").value;
  }
  function proc896() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").value, 2.3]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").value;
  }
  function proc911() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").value;
  }
  function proc926() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").value;
  }
  function proc941() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc958() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc973() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc988() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1005() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1020() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1035() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").value, [0, 0, 1]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").value;
  }
  function proc1050() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").value, 2.3]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").value;
  }
  function proc1065() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1082() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1097() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1112() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1129() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1144() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1159() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").value;
  }
  function proc1174() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").value;
  }
  function proc1189() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1206() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1221() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1236() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1253() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1268() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1283() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").value;
  }
  function proc1298() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1315() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1330() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1345() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").value;
  }
  function proc1360() {
    rt.log("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").value, 2.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").value;
  }
  function proc1375() {
    rt.log("<pointer/set and get - KHR_materials_volume/attenuationColor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").value;
  }
  function proc1390() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1407() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0,0001)", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1422() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/0/color", "float3", [1, 0, 0])) {
      if (m.eq(rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value, [1, 0, 0])) {
        if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = m.eq(rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value, [1, 0, 0]);
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Successful");
          proc7();
        }
      } else {
        proc7();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/0/color with (1.00, 0.00, 0.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/1/intensity", "float", 4)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").value === 4) {
        if (rt.ptrSet("/nodes/12/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = rt.ptrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").value === 4;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Test Successful");
          proc23();
        }
      } else {
        proc23();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/1/intensity with 4 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/2/range", "float", 9)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").value === 9) {
        if (rt.ptrSet("/nodes/19/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = rt.ptrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").value === 9;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Test Successful");
          proc39();
        }
      } else {
        proc39();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/2/range with 9 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float", 2)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").value === 2) {
        if (rt.ptrSet("/nodes/26/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").value === 2;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Test Successful");
          proc218();
        }
      } else {
        proc218();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle with 2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float", 5)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").value === 5) {
        if (rt.ptrSet("/nodes/33/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").value === 5;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Test Successful");
          proc233();
        }
      } else {
        proc233();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle with 5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3", [1, 0, 0])) {
      if (m.eq(rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3").value, [1, 0, 0])) {
        if (rt.ptrSet("/nodes/40/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = m.eq(rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3").value, [1, 0, 0]);
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Test Successful");
          proc248();
        }
      } else {
        proc248();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/5/color with (1.00, 0.00, 0.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float", 4)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float").value === 4) {
        if (rt.ptrSet("/nodes/47/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float").value === 4;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Test Successful");
          proc263();
        }
      } else {
        proc263();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/6/intensity with 4 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float", 9)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float").value === 9) {
        if (rt.ptrSet("/nodes/54/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float").value === 9;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Test Successful");
          proc278();
        }
      } else {
        proc278();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/7/range with 9 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float", 2)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float").value === 2) {
        if (rt.ptrSet("/nodes/61/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float").value === 2;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Test Successful");
          proc293();
        }
      } else {
        proc293();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/8/spot/innerConeAngle with 2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float", 5)) {
      if (rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float").value === 5) {
        if (rt.ptrSet("/nodes/68/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float").value === 5;
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Test Successful");
          proc308();
        }
      } else {
        proc308();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/9/spot/outerConeAngle with 5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle) {
      rt.log("ERROR! <pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/alphaCutoff", "float", 0.5)) {
      if (rt.ptrGet("/materials/6/alphaCutoff", "float").value === 0.5) {
        if (rt.ptrSet("/nodes/75/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff = rt.ptrGet("/materials/6/alphaCutoff", "float").value === 0.5;
          rt.log("<pointer/set and get - /alphaCutoff>: Test Successful");
          proc323();
        }
      } else {
        proc323();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/alphaCutoff with 0,5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff) {
      rt.log("ERROR! <pointer/set and get - /alphaCutoff>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/emissiveFactor", "float3", [1, 0, 0])) {
      if (m.eq(rt.ptrGet("/materials/6/emissiveFactor", "float3").value, [1, 0, 0])) {
        if (rt.ptrSet("/nodes/81/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor = m.eq(rt.ptrGet("/materials/6/emissiveFactor", "float3").value, [1, 0, 0]);
          rt.log("<pointer/set and get - /emissiveFactor>: Test Successful");
          proc338();
        }
      } else {
        proc338();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveFactor with (1.00, 0.00, 0.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor) {
      rt.log("ERROR! <pointer/set and get - /emissiveFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/normalTexture/scale", "float", 0.5)) {
      if (rt.ptrGet("/materials/6/normalTexture/scale", "float").value === 0.5) {
        if (rt.ptrSet("/nodes/87/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale = rt.ptrGet("/materials/6/normalTexture/scale", "float").value === 0.5;
          rt.log("<pointer/set and get - /normalTexture/scale>: Test Successful");
          proc353();
        }
      } else {
        proc353();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/scale with 0,5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale) {
      rt.log("ERROR! <pointer/set and get - /normalTexture/scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/occlusionTexture/strength", "float", 0.5)) {
      if (rt.ptrGet("/materials/6/occlusionTexture/strength", "float").value === 0.5) {
        if (rt.ptrSet("/nodes/93/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength = rt.ptrGet("/materials/6/occlusionTexture/strength", "float").value === 0.5;
          rt.log("<pointer/set and get - /occlusionTexture/strength>: Test Successful");
          proc368();
        }
      } else {
        proc368();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/strength with 0,5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength) {
      rt.log("ERROR! <pointer/set and get - /occlusionTexture/strength>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/99/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset = m.eq(rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /normalTexture texture offset>: Test Successful");
          proc383();
        }
      } else {
        proc383();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - /normalTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/105/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation = m.abs(rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - /normalTexture texture rotation>: Test Successful");
          proc400();
        }
      } else {
        proc400();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - /normalTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/111/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale = m.eq(rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /normalTexture texture scale>: Test Successful");
          proc415();
        }
      } else {
        proc415();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - /normalTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/117/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset = m.eq(rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /occlusionTexture texture offset>: Test Successful");
          proc430();
        }
      } else {
        proc430();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - /occlusionTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/123/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation = m.abs(rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - /occlusionTexture texture rotation>: Test Successful");
          proc447();
        }
      } else {
        proc447();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - /occlusionTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/129/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale = m.eq(rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /occlusionTexture texture scale>: Test Successful");
          proc462();
        }
      } else {
        proc462();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - /occlusionTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/135/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset = m.eq(rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /emissiveTexture texture offset>: Test Successful");
          proc477();
        }
      } else {
        proc477();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - /emissiveTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/141/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation = m.abs(rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - /emissiveTexture texture rotation>: Test Successful");
          proc494();
        }
      } else {
        proc494();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - /emissiveTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/147/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale = m.eq(rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /emissiveTexture texture scale>: Test Successful");
          proc509();
        }
      } else {
        proc509();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - /emissiveTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4", [0, 0, 1, 1])) {
      if (m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").value, [0, 0, 1, 1])) {
        if (rt.ptrSet("/nodes/154/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor = m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").value, [0, 0, 1, 1]);
          rt.log("<pointer/set and get - /baseColorFactor>: Test Successful");
          proc524();
        }
      } else {
        proc524();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorFactor with RGBA(0.000, 0.000, 1.000, 1.000) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor) {
      rt.log("ERROR! <pointer/set and get - /baseColorFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/metallicFactor", "float", 0.5)) {
      if (rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").value === 0.5) {
        if (rt.ptrSet("/nodes/160/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__metallicFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").value === 0.5;
          rt.log("<pointer/set and get - /metallicFactor>: Test Successful");
          proc539();
        }
      } else {
        proc539();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicFactor with 0,5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__metallicFactor) {
      rt.log("ERROR! <pointer/set and get - /metallicFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float", 0.5)) {
      if (rt.ptrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").value === 0.5) {
        if (rt.ptrSet("/nodes/166/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").value === 0.5;
          rt.log("<pointer/set and get - /roughnessFactor>: Test Successful");
          proc554();
        }
      } else {
        proc554();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/roughnessFactor with 0,5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor) {
      rt.log("ERROR! <pointer/set and get - /roughnessFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/172/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset = m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /baseColorTexture texture offset>: Test Successful");
          proc569();
        }
      } else {
        proc569();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - /baseColorTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/178/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation = m.abs(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - /baseColorTexture texture rotation>: Test Successful");
          proc586();
        }
      } else {
        proc586();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - /baseColorTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/184/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale = m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /baseColorTexture texture scale>: Test Successful");
          proc601();
        }
      } else {
        proc601();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - /baseColorTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/190/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset = m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /metallicRoughnessTexture texture offset>: Test Successful");
          proc616();
        }
      } else {
        proc616();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - /metallicRoughnessTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/196/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = m.abs(rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Test Successful");
          proc633();
        }
      } else {
        proc633();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - /metallicRoughnessTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/202/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale = m.eq(rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - /metallicRoughnessTexture texture scale>: Test Successful");
          proc648();
        }
      } else {
        proc648();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - /metallicRoughnessTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float", 2)) {
      if (rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").value === 2) {
        if (rt.ptrSet("/nodes/209/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").value === 2;
          rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Test Successful");
          proc663();
        }
      } else {
        proc663();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength with 2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float", 0.5235988)) {
      if (m.abs(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").value - 0.5235988) < 0.0001) {
        if (rt.ptrSet("/nodes/215/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = m.abs(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").value - 0.5235988) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Test Successful");
          proc680();
        }
      } else {
        proc680();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation with 0,5235988 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/221/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = m.eq(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Test Successful");
          proc695();
        }
      } else {
        proc695();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/227/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = m.abs(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Test Successful");
          proc712();
        }
      } else {
        proc712();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/233/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = m.eq(rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Test Successful");
          proc727();
        }
      } else {
        proc727();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/240/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Test Successful");
          proc742();
        }
      } else {
        proc742();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/246/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = m.abs(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Test Successful");
          proc759();
        }
      } else {
        proc759();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/252/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Test Successful");
          proc774();
        }
      } else {
        proc774();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/258/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Test Successful");
          proc789();
        }
      } else {
        proc789();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/264/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = m.abs(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Test Successful");
          proc806();
        }
      } else {
        proc806();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/270/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = m.eq(rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Test Successful");
          proc821();
        }
      } else {
        proc821();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float", 2)) {
      if (rt.ptrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").value === 2) {
        if (rt.ptrSet("/nodes/277/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion = rt.ptrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").value === 2;
          rt.log("<pointer/set and get - KHR_materials_dispersion/dispersion>: Test Successful");
          proc836();
        }
      } else {
        proc836();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/10/extensions/KHR_materials_dispersion/dispersion with 2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_dispersion/dispersion>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float", 2)) {
      if (rt.ptrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").value === 2) {
        if (rt.ptrSet("/nodes/284/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = rt.ptrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").value === 2;
          rt.log("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Test Successful");
          proc851();
        }
      } else {
        proc851();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength with 2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/12/extensions/KHR_materials_ior/ior", "float", 3)) {
      if (rt.ptrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").value === 3) {
        if (rt.ptrSet("/nodes/291/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior = rt.ptrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").value === 3;
          rt.log("<pointer/set and get - KHR_materials_ior/ior>: Test Successful");
          proc866();
        }
      } else {
        proc866();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/12/extensions/KHR_materials_ior/ior with 3 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_ior/ior>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float", 1.2)) {
      if (rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").value === 1.2) {
        if (rt.ptrSet("/nodes/298/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").value === 1.2;
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Test Successful");
          proc881();
        }
      } else {
        proc881();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceFactor with 1,2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float", 2.3)) {
      if (rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").value === 2.3) {
        if (rt.ptrSet("/nodes/304/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").value === 2.3;
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Test Successful");
          proc896();
        }
      } else {
        proc896();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceIor with 2,3 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float", 0.5)) {
      if (rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").value === 0.5) {
        if (rt.ptrSet("/nodes/310/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").value === 0.5;
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Test Successful");
          proc911();
        }
      } else {
        proc911();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum with 0,5 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float", 1.2)) {
      if (rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").value === 1.2) {
        if (rt.ptrSet("/nodes/316/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").value === 1.2;
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Test Successful");
          proc926();
        }
      } else {
        proc926();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum with 1,2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/322/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Test Successful");
          proc941();
        }
      } else {
        proc941();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/328/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = m.abs(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Test Successful");
          proc958();
        }
      } else {
        proc958();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/334/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Test Successful");
          proc973();
        }
      } else {
        proc973();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/340/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Test Successful");
          proc988();
        }
      } else {
        proc988();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/346/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = m.abs(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Test Successful");
          proc1005();
        }
      } else {
        proc1005();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/352/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = m.eq(rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Test Successful");
          proc1020();
        }
      } else {
        proc1020();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3", [0, 0, 1])) {
      if (m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").value, [0, 0, 1])) {
        if (rt.ptrSet("/nodes/359/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").value, [0, 0, 1]);
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Test Successful");
          proc1035();
        }
      } else {
        proc1035();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorFactor with (0.00, 0.00, 1.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float", 2.3)) {
      if (rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").value === 2.3) {
        if (rt.ptrSet("/nodes/365/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").value === 2.3;
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Test Successful");
          proc1050();
        }
      } else {
        proc1050();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor with 2,3 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/371/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Test Successful");
          proc1065();
        }
      } else {
        proc1065();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/377/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = m.abs(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Test Successful");
          proc1082();
        }
      } else {
        proc1082();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/383/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Test Successful");
          proc1097();
        }
      } else {
        proc1097();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/389/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Test Successful");
          proc1112();
        }
      } else {
        proc1112();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/395/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = m.abs(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Test Successful");
          proc1129();
        }
      } else {
        proc1129();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/401/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = m.eq(rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Test Successful");
          proc1144();
        }
      } else {
        proc1144();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float", 1.2)) {
      if (rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").value === 1.2) {
        if (rt.ptrSet("/nodes/408/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").value === 1.2;
          rt.log("<pointer/set and get - KHR_materials_specular/specularFactor>: Test Successful");
          proc1159();
        }
      } else {
        proc1159();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularFactor with 1,2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3", [1, 0, 0])) {
      if (m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").value, [1, 0, 0])) {
        if (rt.ptrSet("/nodes/414/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor = m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").value, [1, 0, 0]);
          rt.log("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Test Successful");
          proc1174();
        }
      } else {
        proc1174();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorFactor with (1.00, 0.00, 0.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/420/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Test Successful");
          proc1189();
        }
      } else {
        proc1189();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/426/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = m.abs(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Test Successful");
          proc1206();
        }
      } else {
        proc1206();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/432/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Test Successful");
          proc1221();
        }
      } else {
        proc1221();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/438/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Test Successful");
          proc1236();
        }
      } else {
        proc1236();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/444/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = m.abs(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Test Successful");
          proc1253();
        }
      } else {
        proc1253();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/450/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = m.eq(rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Test Successful");
          proc1268();
        }
      } else {
        proc1268();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float", 1.2)) {
      if (rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").value === 1.2) {
        if (rt.ptrSet("/nodes/457/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").value === 1.2;
          rt.log("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Test Successful");
          proc1283();
        }
      } else {
        proc1283();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionFactor with 1,2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/463/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = m.eq(rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Test Successful");
          proc1298();
        }
      } else {
        proc1298();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/469/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = m.abs(rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Test Successful");
          proc1315();
        }
      } else {
        proc1315();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/475/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = m.eq(rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Test Successful");
          proc1330();
        }
      } else {
        proc1330();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float", 1.2)) {
      if (rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").value === 1.2) {
        if (rt.ptrSet("/nodes/482/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").value === 1.2;
          rt.log("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Test Successful");
          proc1345();
        }
      } else {
        proc1345();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessFactor with 1,2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessFactor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float", 2.2)) {
      if (rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").value === 2.2) {
        if (rt.ptrSet("/nodes/488/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").value === 2.2;
          rt.log("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Test Successful");
          proc1360();
        }
      } else {
        proc1360();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationDistance with 2,2 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_volume/attenuationDistance>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3", [1, 0, 0])) {
      if (m.eq(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").value, [1, 0, 0])) {
        if (rt.ptrSet("/nodes/494/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor = m.eq(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").value, [1, 0, 0]);
          rt.log("<pointer/set and get - KHR_materials_volume/attenuationColor>: Test Successful");
          proc1375();
        }
      } else {
        proc1375();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationColor with (1.00, 0.00, 0.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_volume/attenuationColor>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/500/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = m.eq(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Test Successful");
          proc1390();
        }
      } else {
        proc1390();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float", 0.7853982)) {
      if (m.abs(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001) {
        if (rt.ptrSet("/nodes/506/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = m.abs(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").value - 0.7853982) < 0.0001;
          rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Test Successful");
          proc1407();
        }
      } else {
        proc1407();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation with 0,7853982 can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Test Failed");
    }
  });
  rt.onStart(() => {
    if (rt.ptrSet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2", [2, 3])) {
      if (m.eq(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3])) {
        if (rt.ptrSet("/nodes/512/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = m.eq(rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]);
          rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Test Successful");
          proc1422();
        }
      } else {
        proc1422();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale with (2.00, 3.00) can't be set.");
    }
    if (!V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale) {
      rt.log("ERROR! <pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Test Failed");
    }
  });
  rt.onStart(() => {
    rt.send(E.test_onStart);
    if (V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle && V.TestResult_HasPassed_pointer_set_and_get__alphaCutoff && V.TestResult_HasPassed_pointer_set_and_get__emissiveFactor && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_scale && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__baseColorFactor && V.TestResult_HasPassed_pointer_set_and_get__metallicFactor && V.TestResult_HasPassed_pointer_set_and_get__roughnessFactor && V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation && V.TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale) {
      rt.send(E.test_onSuccess);
    } else {
      rt.send(E.test_onFailed);
    }
  });
});

