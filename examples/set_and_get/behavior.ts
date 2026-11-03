import { createEngine, m } from "@gltfi/runtime-lib";

export default createEngine((rt) => {
  const V = rt.vars({ TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/color", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/intensity", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/range", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/color", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/intensity", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/range", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle: rt.withId("TestResult_HasPassed_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle", rt.bool(false)), TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle: rt.withId("TestResult_pointer/set and get_/extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__alphaCutoff: rt.withId("TestResult_HasPassed_pointer/set and get_/alphaCutoff", rt.bool(false)), TestResult_pointer_set_and_get__alphaCutoff: rt.withId("TestResult_pointer/set and get_/alphaCutoff", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveFactor", rt.bool(false)), TestResult_pointer_set_and_get__emissiveFactor: rt.withId("TestResult_pointer/set and get_/emissiveFactor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture/scale", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_scale: rt.withId("TestResult_pointer/set and get_/normalTexture/scale", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_strength: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture/strength", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_strength: rt.withId("TestResult_pointer/set and get_/occlusionTexture/strength", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/normalTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/normalTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__normalTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/normalTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__normalTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/normalTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/occlusionTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/occlusionTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__occlusionTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/occlusionTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__occlusionTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/occlusionTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__emissiveTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/emissiveTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__emissiveTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/emissiveTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__emissiveTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/emissiveTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__emissiveTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/emissiveTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorFactor", rt.bool(false)), TestResult_pointer_set_and_get__baseColorFactor: rt.withId("TestResult_pointer/set and get_/baseColorFactor", rt.float4(-0.0142, -0.0142, -0.0142, 0)), TestResult_HasPassed_pointer_set_and_get__metallicFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicFactor", rt.bool(false)), TestResult_pointer_set_and_get__metallicFactor: rt.withId("TestResult_pointer/set and get_/metallicFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__roughnessFactor: rt.withId("TestResult_HasPassed_pointer/set and get_/roughnessFactor", rt.bool(false)), TestResult_pointer_set_and_get__roughnessFactor: rt.withId("TestResult_pointer/set and get_/roughnessFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__baseColorTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/baseColorTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__baseColorTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/baseColorTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__baseColorTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/baseColorTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__baseColorTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/baseColorTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_/metallicRoughnessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_/metallicRoughnessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get__metallicRoughnessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_/metallicRoughnessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_/metallicRoughnessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyStrength", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyRotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_anisotropy/anisotropyTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_dispersion_dispersion: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_dispersion/dispersion", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion: rt.withId("TestResult_pointer/set and get_KHR_materials_dispersion/dispersion", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength: rt.withId("TestResult_pointer/set and get_KHR_materials_emissive_strength/emissiveStrength", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_ior_ior: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_ior/ior", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_ior_ior: rt.withId("TestResult_pointer/set and get_KHR_materials_ior/ior", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceIor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceIor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMinimum", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessMaximum", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_iridescence/iridescenceThicknessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorFactor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenColorTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_sheen/sheenRoughnessTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorFactor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_specular/specularColorTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_transmission/transmissionTexture texture scale", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessFactor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessFactor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessFactor", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationDistance: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationDistance", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/attenuationDistance", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_attenuationColor: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/attenuationColor", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/attenuationColor", rt.float3(-0.0142, -0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture offset", rt.float2(-0.0142, -0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture rotation", rt.float(-0.0142)), TestResult_HasPassed_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale: rt.withId("TestResult_HasPassed_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale", rt.bool(false)), TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale: rt.withId("TestResult_pointer/set and get_KHR_materials_volume/thicknessTexture texture scale", rt.float2(-0.0142, -0.0142)) });
  const E = rt.events({ test_onStart: { externalId: "test/onStart", expectedDuration: 0 }, test_onSuccess: { externalId: "test/onSuccess" }, test_onFailed: { externalId: "test/onFailed" } });
  function proc11() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value;
  }
  function proc26() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/intensity>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").value, 4]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__intensity = rt.ptrGet("/extensions/KHR_lights_punctual/lights/1/intensity", "float").value;
  }
  function proc204() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/range>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").value, 9]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__range = rt.ptrGet("/extensions/KHR_lights_punctual/lights/2/range", "float").value;
  }
  function proc219() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/innerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").value, 2]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_innerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/3/spot/innerConeAngle", "float").value;
  }
  function proc234() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/spot/outerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").value, 5]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__spot_outerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/4/spot/outerConeAngle", "float").value;
  }
  function proc249() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/color>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____color = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/color", { "lightRef": "/extensions/KHR_lights_punctual/lights/5" }, "float3").value;
  }
  function proc264() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/intensity>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float").value, 4]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____intensity = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/intensity", { "lightRef": "/extensions/KHR_lights_punctual/lights/6" }, "float").value;
  }
  function proc279() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/range>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float").value, 9]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____range = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/range", { "lightRef": "/extensions/KHR_lights_punctual/lights/7" }, "float").value;
  }
  function proc294() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/innerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float").value, 2]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_innerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/innerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/8" }, "float").value;
  }
  function proc309() {
    rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[]/spot/outerConeAngle>: Value is {0}, should be {1} ", [rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float").value, 5]);
    V.TestResult_pointer_set_and_get__extensions_KHR_lights_punctual_lights____spot_outerConeAngle = rt.ptrGet("/extensions/KHR_lights_punctual/lights/{lightRef}/spot/outerConeAngle", { "lightRef": "/extensions/KHR_lights_punctual/lights/9" }, "float").value;
  }
  function proc324() {
    rt.log("<pointer/set and get - /alphaCutoff>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/alphaCutoff", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__alphaCutoff = rt.ptrGet("/materials/6/alphaCutoff", "float").value;
  }
  function proc339() {
    rt.log("<pointer/set and get - /emissiveFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/emissiveFactor", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get__emissiveFactor = rt.ptrGet("/materials/6/emissiveFactor", "float3").value;
  }
  function proc354() {
    rt.log("<pointer/set and get - /normalTexture/scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/normalTexture/scale", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__normalTexture_scale = rt.ptrGet("/materials/6/normalTexture/scale", "float").value;
  }
  function proc369() {
    rt.log("<pointer/set and get - /occlusionTexture/strength>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/occlusionTexture/strength", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__occlusionTexture_strength = rt.ptrGet("/materials/6/occlusionTexture/strength", "float").value;
  }
  function proc384() {
    rt.log("<pointer/set and get - /normalTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__normalTexture_texture_offset = rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc401() {
    rt.log("<pointer/set and get - /normalTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__normalTexture_texture_rotation = rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc416() {
    rt.log("<pointer/set and get - /normalTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__normalTexture_texture_scale = rt.ptrGet("/materials/6/normalTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc431() {
    rt.log("<pointer/set and get - /occlusionTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_offset = rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc448() {
    rt.log("<pointer/set and get - /occlusionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_rotation = rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc463() {
    rt.log("<pointer/set and get - /occlusionTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__occlusionTexture_texture_scale = rt.ptrGet("/materials/6/occlusionTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc478() {
    rt.log("<pointer/set and get - /emissiveTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_offset = rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc495() {
    rt.log("<pointer/set and get - /emissiveTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_rotation = rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc510() {
    rt.log("<pointer/set and get - /emissiveTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__emissiveTexture_texture_scale = rt.ptrGet("/materials/6/emissiveTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc525() {
    rt.log("<pointer/set and get - /baseColorFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").value, [0, 0, 1, 1]]);
    V.TestResult_pointer_set_and_get__baseColorFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorFactor", "float4").value;
  }
  function proc540() {
    rt.log("<pointer/set and get - /metallicFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__metallicFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicFactor", "float").value;
  }
  function proc555() {
    rt.log("<pointer/set and get - /roughnessFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get__roughnessFactor = rt.ptrGet("/materials/7/pbrMetallicRoughness/roughnessFactor", "float").value;
  }
  function proc570() {
    rt.log("<pointer/set and get - /baseColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_offset = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc587() {
    rt.log("<pointer/set and get - /baseColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_rotation = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc602() {
    rt.log("<pointer/set and get - /baseColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__baseColorTexture_texture_scale = rt.ptrGet("/materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc617() {
    rt.log("<pointer/set and get - /metallicRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_offset = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc634() {
    rt.log("<pointer/set and get - /metallicRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_rotation = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc649() {
    rt.log("<pointer/set and get - /metallicRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get__metallicRoughnessTexture_texture_scale = rt.ptrGet("/materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc664() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyStrength>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").value, 2]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyStrength = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyStrength", "float").value;
  }
  function proc681() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyRotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").value, 0.5235988]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyRotation = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation", "float").value;
  }
  function proc696() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_offset = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc713() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_rotation = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc728() {
    rt.log("<pointer/set and get - KHR_materials_anisotropy/anisotropyTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_anisotropy_anisotropyTexture_texture_scale = rt.ptrGet("/materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc743() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_offset = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc760() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_rotation = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc775() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatTexture_texture_scale = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc790() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_offset = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc807() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_rotation = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc822() {
    rt.log("<pointer/set and get - KHR_materials_clearcoat/clearcoatRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_clearcoat_clearcoatRoughnessTexture_texture_scale = rt.ptrGet("/materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc837() {
    rt.log("<pointer/set and get - KHR_materials_dispersion/dispersion>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").value, 2]);
    V.TestResult_pointer_set_and_get_KHR_materials_dispersion_dispersion = rt.ptrGet("/materials/10/extensions/KHR_materials_dispersion/dispersion", "float").value;
  }
  function proc852() {
    rt.log("<pointer/set and get - KHR_materials_emissive_strength/emissiveStrength>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").value, 2]);
    V.TestResult_pointer_set_and_get_KHR_materials_emissive_strength_emissiveStrength = rt.ptrGet("/materials/11/extensions/KHR_materials_emissive_strength/emissiveStrength", "float").value;
  }
  function proc867() {
    rt.log("<pointer/set and get - KHR_materials_ior/ior>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").value, 3]);
    V.TestResult_pointer_set_and_get_KHR_materials_ior_ior = rt.ptrGet("/materials/12/extensions/KHR_materials_ior/ior", "float").value;
  }
  function proc882() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceFactor = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceFactor", "float").value;
  }
  function proc897() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceIor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").value, 2.3]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceIor = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceIor", "float").value;
  }
  function proc912() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMinimum>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").value, 0.5]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMinimum = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum", "float").value;
  }
  function proc927() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessMaximum>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessMaximum = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum", "float").value;
  }
  function proc942() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_offset = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc959() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_rotation = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc974() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceTexture_texture_scale = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc989() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_offset = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1006() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_rotation = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1021() {
    rt.log("<pointer/set and get - KHR_materials_iridescence/iridescenceThicknessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_iridescence_iridescenceThicknessTexture_texture_scale = rt.ptrGet("/materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1036() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").value, [0, 0, 1]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorFactor = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorFactor", "float3").value;
  }
  function proc1051() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").value, 2.3]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessFactor = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor", "float").value;
  }
  function proc1066() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_offset = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1083() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_rotation = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1098() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenColorTexture_texture_scale = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1113() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_offset = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1130() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_rotation = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1145() {
    rt.log("<pointer/set and get - KHR_materials_sheen/sheenRoughnessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_sheen_sheenRoughnessTexture_texture_scale = rt.ptrGet("/materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1160() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularFactor = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularFactor", "float").value;
  }
  function proc1175() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorFactor = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorFactor", "float3").value;
  }
  function proc1190() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_offset = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1207() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_rotation = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1222() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularTexture_texture_scale = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1237() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_offset = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1254() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_rotation = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1269() {
    rt.log("<pointer/set and get - KHR_materials_specular/specularColorTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_specular_specularColorTexture_texture_scale = rt.ptrGet("/materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1284() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionFactor = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionFactor", "float").value;
  }
  function proc1299() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_offset = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1316() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_rotation = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1331() {
    rt.log("<pointer/set and get - KHR_materials_transmission/transmissionTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_transmission_transmissionTexture_texture_scale = rt.ptrGet("/materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  function proc1346() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessFactor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").value, 1.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessFactor = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessFactor", "float").value;
  }
  function proc1361() {
    rt.log("<pointer/set and get - KHR_materials_volume/attenuationDistance>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").value, 2.2]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationDistance = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationDistance", "float").value;
  }
  function proc1376() {
    rt.log("<pointer/set and get - KHR_materials_volume/attenuationColor>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").value, [1, 0, 0]]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_attenuationColor = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/attenuationColor", "float3").value;
  }
  function proc1391() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture offset>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_offset = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset", "float2").value;
  }
  function proc1408() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture rotation>: Value is {0}, should be {1} (Proximity range: 0.0001)", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").value, 0.7853982]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_rotation = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation", "float").value;
  }
  function proc1423() {
    rt.log("<pointer/set and get - KHR_materials_volume/thicknessTexture texture scale>: Value is {0}, should be {1} ", [rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").value, [2, 3]]);
    V.TestResult_pointer_set_and_get_KHR_materials_volume_thicknessTexture_texture_scale = rt.ptrGet("/materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale", "float2").value;
  }
  rt.onStart(() => {
    if (rt.ptrSet("/extensions/KHR_lights_punctual/lights/0/color", "float3", [1, 0, 0])) {
      if (m.eq(rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value, [1, 0, 0])) {
        if (rt.ptrSet("/nodes/5/translation", "float3", [0, 0, 0.8])) {
          V.TestResult_HasPassed_pointer_set_and_get__extensions_KHR_lights_punctual_lights__lightIndex__color = m.eq(rt.ptrGet("/extensions/KHR_lights_punctual/lights/0/color", "float3").value, [1, 0, 0]);
          rt.log("<pointer/set and get - /extensions/KHR_lights_punctual/lights/[lightIndex]/color>: Test Successful");
          proc11();
        }
      } else {
        proc11();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/0/color with (1, 0, 0) can't be set.");
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
          proc26();
        }
      } else {
        proc26();
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
          proc204();
        }
      } else {
        proc204();
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
          proc219();
        }
      } else {
        proc219();
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
          proc234();
        }
      } else {
        proc234();
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
          proc249();
        }
      } else {
        proc249();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /extensions/KHR_lights_punctual/lights/5/color with (1, 0, 0) can't be set.");
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
          proc264();
        }
      } else {
        proc264();
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
          proc279();
        }
      } else {
        proc279();
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
          proc294();
        }
      } else {
        proc294();
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
          proc309();
        }
      } else {
        proc309();
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
          proc324();
        }
      } else {
        proc324();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/alphaCutoff with 0.5 can't be set.");
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
          proc339();
        }
      } else {
        proc339();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveFactor with (1, 0, 0) can't be set.");
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
          proc354();
        }
      } else {
        proc354();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/scale with 0.5 can't be set.");
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
          proc369();
        }
      } else {
        proc369();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/strength with 0.5 can't be set.");
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
          proc384();
        }
      } else {
        proc384();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc401();
        }
      } else {
        proc401();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc416();
        }
      } else {
        proc416();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/normalTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc431();
        }
      } else {
        proc431();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc448();
        }
      } else {
        proc448();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc463();
        }
      } else {
        proc463();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/occlusionTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc478();
        }
      } else {
        proc478();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc495();
        }
      } else {
        proc495();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc510();
        }
      } else {
        proc510();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/6/emissiveTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc525();
        }
      } else {
        proc525();
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
          proc540();
        }
      } else {
        proc540();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicFactor with 0.5 can't be set.");
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
          proc555();
        }
      } else {
        proc555();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/roughnessFactor with 0.5 can't be set.");
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
          proc570();
        }
      } else {
        proc570();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc587();
        }
      } else {
        proc587();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc602();
        }
      } else {
        proc602();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc617();
        }
      } else {
        proc617();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc634();
        }
      } else {
        proc634();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc649();
        }
      } else {
        proc649();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/7/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc664();
        }
      } else {
        proc664();
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
          proc681();
        }
      } else {
        proc681();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyRotation with 0.5235988 can't be set.");
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
          proc696();
        }
      } else {
        proc696();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc713();
        }
      } else {
        proc713();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc728();
        }
      } else {
        proc728();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/8/extensions/KHR_materials_anisotropy/anisotropyTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc743();
        }
      } else {
        proc743();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc760();
        }
      } else {
        proc760();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc775();
        }
      } else {
        proc775();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc790();
        }
      } else {
        proc790();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc807();
        }
      } else {
        proc807();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc822();
        }
      } else {
        proc822();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/9/extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc837();
        }
      } else {
        proc837();
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
          proc852();
        }
      } else {
        proc852();
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
          proc867();
        }
      } else {
        proc867();
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
          proc882();
        }
      } else {
        proc882();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceFactor with 1.2 can't be set.");
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
          proc897();
        }
      } else {
        proc897();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceIor with 2.3 can't be set.");
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
          proc912();
        }
      } else {
        proc912();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMinimum with 0.5 can't be set.");
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
          proc927();
        }
      } else {
        proc927();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessMaximum with 1.2 can't be set.");
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
          proc942();
        }
      } else {
        proc942();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc959();
        }
      } else {
        proc959();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc974();
        }
      } else {
        proc974();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc989();
        }
      } else {
        proc989();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1006();
        }
      } else {
        proc1006();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1021();
        }
      } else {
        proc1021();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/13/extensions/KHR_materials_iridescence/iridescenceThicknessTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc1036();
        }
      } else {
        proc1036();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorFactor with (0, 0, 1) can't be set.");
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
          proc1051();
        }
      } else {
        proc1051();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessFactor with 2.3 can't be set.");
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
          proc1066();
        }
      } else {
        proc1066();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1083();
        }
      } else {
        proc1083();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1098();
        }
      } else {
        proc1098();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenColorTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc1113();
        }
      } else {
        proc1113();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1130();
        }
      } else {
        proc1130();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1145();
        }
      } else {
        proc1145();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/14/extensions/KHR_materials_sheen/sheenRoughnessTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc1160();
        }
      } else {
        proc1160();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularFactor with 1.2 can't be set.");
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
          proc1175();
        }
      } else {
        proc1175();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorFactor with (1, 0, 0) can't be set.");
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
          proc1190();
        }
      } else {
        proc1190();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1207();
        }
      } else {
        proc1207();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1222();
        }
      } else {
        proc1222();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc1237();
        }
      } else {
        proc1237();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1254();
        }
      } else {
        proc1254();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1269();
        }
      } else {
        proc1269();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/15/extensions/KHR_materials_specular/specularColorTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc1284();
        }
      } else {
        proc1284();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionFactor with 1.2 can't be set.");
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
          proc1299();
        }
      } else {
        proc1299();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1316();
        }
      } else {
        proc1316();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1331();
        }
      } else {
        proc1331();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/16/extensions/KHR_materials_transmission/transmissionTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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
          proc1346();
        }
      } else {
        proc1346();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessFactor with 1.2 can't be set.");
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
          proc1361();
        }
      } else {
        proc1361();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationDistance with 2.2 can't be set.");
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
          proc1376();
        }
      } else {
        proc1376();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/attenuationColor with (1, 0, 0) can't be set.");
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
          proc1391();
        }
      } else {
        proc1391();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/offset with (2, 3) can't be set.");
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
          proc1408();
        }
      } else {
        proc1408();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/rotation with 0.7853982 can't be set.");
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
          proc1423();
        }
      } else {
        proc1423();
      }
    } else {
      rt.log("ERROR! Flow-[err] on Set pointer: /materials/17/extensions/KHR_materials_volume/thicknessTexture/extensions/KHR_texture_transform/scale with (2, 3) can't be set.");
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

