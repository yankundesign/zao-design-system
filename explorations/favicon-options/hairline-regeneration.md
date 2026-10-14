# Hairline-informed favicon regeneration

Created with the built-in imagegen tool. Original selected images remain unchanged.

## Verified reference

- [Hairline projection source](https://github.com/lucasmarkes/hairline/blob/main/packages/hairline/src/core/iso.ts)
- [Hairline drawing rules](https://github.com/lucasmarkes/hairline/blob/main/skills/hairline-create/rules.md)

Hairline's resting camera is `Cam(45, 0.5, S)`. Its two ground-axis edge families have slopes +1/2 and -1/2; upright edges stay vertical. The guides were drawn from this same orthographic projection before regeneration. Raster generation can introduce small angle variation; the saved guides retain the exact construction.

Projection guides: [bracket](hairline-guides/bracket-projection.svg), [joint](hairline-guides/joint-projection.svg). Corresponding PNGs are saved beside them and were supplied as geometry references to imagegen along with the originally selected images.

## Solid timber bracket

Use case: precise-object-edit.
Regenerate the selected ZAO favicon with CORRECT projection, retaining its identity.
Two supplied references: Image 1 is the liked original icon, which supplies the subject, proportions, black/gray visual direction and overall character. Image 2 is a mathematically projected geometry guide, which is the AUTHORITY FOR THE CAMERA AND FACE ANGLES. Do not carry over Image 1's inconsistent frontal extrusion.
Use Hairline's actual 2:1 ORTHOGRAPHIC camera: azimuth 45 degrees, elevation 30 degrees. The two ground edge families rise/fall one unit for every two units across (screen angles plus/minus 26.565 degrees), while upright edges stay vertical. Parallel edges remain parallel, with no vanishing point. Every part uses this one camera, the same axis basis and the same thickness scale. Closely follow Image 2's projected face shapes and shared vertices, not just a loose impression of isometric.
Finish: precise polished graphic icon, not photorealistic. Retain strong near-black main faces, crisp restrained gray return/top faces, worked corners and broad clear silhouette. Carefully differentiated planes with FLAT fills, no gradients, soft lighting, texture, gloss, cast shadow or blur. Thin seams may identify construction, but don't split a solid into hovering fragments. Correct occlusion; no hidden edge through a nearer face. No added pieces, letters, Zs, border frame, text, labels or watermark.
Output ONE standalone square favicon, centered and optically balanced on a pale neutral solid square background, object occupying around 75-80% of the canvas. Subject: the solid timber bracket from Image 1. Preserve its broad top cap with a central downward tongue, two supporting curved/stepped shoulders forming the bracket arm, and central square stem/foot. Image 2 shows this arrangement reprojected as a physically seated assembly. The shoulders remain balanced in WORLD coordinates, even though the correct camera makes their screen view oblique. Refine the guide's coarse underside into the original's restrained smooth/faceted carved contour WITHOUT changing the camera or inventing decorative cuts. The stem seats into the bracket and the upper tongue seats into its central mouth. Crisp natural contact seams; no black fragments floating across white moats. Preserve the intended character of an interlocking crafted timber assembly.

## Cross-lap joint

Use case: precise-object-edit.
Regenerate the selected ZAO favicon with CORRECT projection, retaining its identity.
Two supplied references: Image 1 is the liked original icon, which supplies the subject, proportions, black/gray visual direction and overall character. Image 2 is a mathematically projected geometry guide, which is the AUTHORITY FOR THE CAMERA AND FACE ANGLES. Do not carry over Image 1's inconsistent frontal extrusion.
Use Hairline's actual 2:1 ORTHOGRAPHIC camera: azimuth 45 degrees, elevation 30 degrees. The two ground edge families rise/fall one unit for every two units across (screen angles plus/minus 26.565 degrees), while upright edges stay vertical. Parallel edges remain parallel, with no vanishing point. Every part uses this one camera, the same axis basis and the same thickness scale. Closely follow Image 2's projected face shapes and shared vertices, not just a loose impression of isometric.
Finish: precise polished graphic icon, not photorealistic. Retain strong near-black main faces, crisp restrained gray return/top faces, worked corners and broad clear silhouette. Carefully differentiated planes with FLAT fills, no gradients, soft lighting, texture, gloss, cast shadow or blur. Thin seams may identify construction, but don't split a solid into hovering fragments. Correct occlusion; no hidden edge through a nearer face. No added pieces, letters, Zs, border frame, text, labels or watermark.
Output ONE standalone square favicon, centered and optically balanced on a pale neutral solid square background, object occupying around 75-80% of the canvas. Subject: the cross-lap joint from Image 1. Preserve the upright central timber and one crossing beam as TWO actual interlocking timbers. Follow Image 2's camera and projected geometry exactly: the upright post remains vertical; the long crossmember edges run on the plus/minus 26.565-degree ground-axis family, rather than staying screen-horizontal. The post continues coherently behind the crossmember at the shared lap seat. Show a small correctly occluded lap/contact seam where useful, not an air gap. Upper and lower post portions belong to the same aligned timber; no three detached blocks, no medical badge, no letter. Retain the original's stout proportions and quiet gray exposed planes.
