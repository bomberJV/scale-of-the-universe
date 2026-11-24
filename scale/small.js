// The small things, from a honey bee down to the Planck length: the zoom red's homepage shares
// with this page (/home/red/sizes.js, with its sizes, sources and drawings), drawn in this
// frame. Words and dimension lines are /home/red/ink.js's, as on the homepage.
//
// V turns the scene in this page's axes (x right, y down, z away from the viewer); the shared
// zoom's turn is in its own (x right, y up, z toward the viewer), so it is V seen with y and z
// turned round.
export function air(ctx, w, h, W, time, V) {
  const F = [1, -1, -1], turn = [0, 1, 2].flatMap(i => [0, 1, 2].map(j => F[i] * V[i][j] * F[j]));
  redSizes.zoom(ctx, w, h, W, time, turn);
}
