/* True north. Phone compasses point to MAGNETIC north, which differs from true north by up to
   ±20° depending on where you stand. This is the World Magnetic Model 2025 (NOAA/NCEI & BGS,
   public domain), valid 2025–2030. Coefficients: n, m, g, h, g-dot, h-dot. */
const WMM_EPOCH = 2025.0;
const WMM_COF = [1,0,-29351.8,0.0,12.0,0.0,1,1,-1410.8,4545.4,9.7,-21.5,2,0,-2556.6,0.0,-11.6,0.0,2,1,2951.1,-3133.6,-5.2,-27.7,2,2,1649.3,-815.1,-8.0,-12.1,3,0,1361.0,0.0,-1.3,0.0,3,1,-2404.1,-56.6,-4.2,4.0,3,2,1243.8,237.5,0.4,-0.3,3,3,453.6,-549.5,-15.6,-4.1,4,0,895.0,0.0,-1.6,0.0,4,1,799.5,278.6,-2.4,-1.1,4,2,55.7,-133.9,-6.0,4.1,4,3,-281.1,212.0,5.6,1.6,4,4,12.1,-375.6,-7.0,-4.4,5,0,-233.2,0.0,0.6,0.0,5,1,368.9,45.4,1.4,-0.5,5,2,187.2,220.2,0.0,2.2,5,3,-138.7,-122.9,0.6,0.4,5,4,-142.0,43.0,2.2,1.7,5,5,20.9,106.1,0.9,1.9,6,0,64.4,0.0,-0.2,0.0,6,1,63.8,-18.4,-0.4,0.3,6,2,76.9,16.8,0.9,-1.6,6,3,-115.7,48.8,1.2,-0.4,6,4,-40.9,-59.8,-0.9,0.9,6,5,14.9,10.9,0.3,0.7,6,6,-60.7,72.7,0.9,0.9,7,0,79.5,0.0,-0.0,0.0,7,1,-77.0,-48.9,-0.1,0.6,7,2,-8.8,-14.4,-0.1,0.5,7,3,59.3,-1.0,0.5,-0.8,7,4,15.8,23.4,-0.1,0.0,7,5,2.5,-7.4,-0.8,-1.0,7,6,-11.1,-25.1,-0.8,0.6,7,7,14.2,-2.3,0.8,-0.2,8,0,23.2,0.0,-0.1,0.0,8,1,10.8,7.1,0.2,-0.2,8,2,-17.5,-12.6,0.0,0.5,8,3,2.0,11.4,0.5,-0.4,8,4,-21.7,-9.7,-0.1,0.4,8,5,16.9,12.7,0.3,-0.5,8,6,15.0,0.7,0.2,-0.6,8,7,-16.8,-5.2,-0.0,0.3,8,8,0.9,3.9,0.2,0.2,9,0,4.6,0.0,-0.0,0.0,9,1,7.8,-24.8,-0.1,-0.3,9,2,3.0,12.2,0.1,0.3,9,3,-0.2,8.3,0.3,-0.3,9,4,-2.5,-3.3,-0.3,0.3,9,5,-13.1,-5.2,0.0,0.2,9,6,2.4,7.2,0.3,-0.1,9,7,8.6,-0.6,-0.1,-0.2,9,8,-8.7,0.8,0.1,0.4,9,9,-12.9,10.0,-0.1,0.1,10,0,-1.3,0.0,0.1,0.0,10,1,-6.4,3.3,0.0,0.0,10,2,0.2,0.0,0.1,-0.0,10,3,2.0,2.4,0.1,-0.2,10,4,-1.0,5.3,-0.0,0.1,10,5,-0.6,-9.1,-0.3,-0.1,10,6,-0.9,0.4,0.0,0.1,10,7,1.5,-4.2,-0.1,0.0,10,8,0.9,-3.8,-0.1,-0.1,10,9,-2.7,0.9,-0.0,0.2,10,10,-3.9,-9.1,-0.0,-0.0,11,0,2.9,0.0,0.0,0.0,11,1,-1.5,0.0,-0.0,-0.0,11,2,-2.5,2.9,0.0,0.1,11,3,2.4,-0.6,0.0,-0.0,11,4,-0.6,0.2,0.0,0.1,11,5,-0.1,0.5,-0.1,-0.0,11,6,-0.6,-0.3,0.0,-0.0,11,7,-0.1,-1.2,-0.0,0.1,11,8,1.1,-1.7,-0.1,-0.0,11,9,-1.0,-2.9,-0.1,0.0,11,10,-0.2,-1.8,-0.1,0.0,11,11,2.6,-2.3,-0.1,0.0,12,0,-2.0,0.0,0.0,0.0,12,1,-0.2,-1.3,0.0,-0.0,12,2,0.3,0.7,-0.0,0.0,12,3,1.2,1.0,-0.0,-0.1,12,4,-1.3,-1.4,-0.0,0.1,12,5,0.6,-0.0,-0.0,-0.0,12,6,0.6,0.6,0.1,-0.0,12,7,0.5,-0.1,-0.0,-0.0,12,8,-0.1,0.8,0.0,0.0,12,9,-0.4,0.1,0.0,-0.0,12,10,-0.2,-1.0,-0.1,-0.0,12,11,-1.3,0.1,-0.0,0.0,12,12,-0.7,0.2,-0.1,-0.1];
const WMM = (() => {
  const N = 12, G = [], Hh = [], GD = [], HD = [], Sch = [];
  for (let n = 0; n <= N; n++) { G.push(new Float64Array(n + 1)); Hh.push(new Float64Array(n + 1)); GD.push(new Float64Array(n + 1)); HD.push(new Float64Array(n + 1)); Sch.push(new Float64Array(n + 1)); }
  for (let i = 0; i < WMM_COF.length; i += 6) {
    const n = WMM_COF[i], m = WMM_COF[i + 1];
    G[n][m] = WMM_COF[i + 2]; Hh[n][m] = WMM_COF[i + 3]; GD[n][m] = WMM_COF[i + 4]; HD[n][m] = WMM_COF[i + 5];
  }
  // Schmidt semi-normalisation factors, folded into the Gauss-normalised recursion below.
  Sch[0][0] = 1;
  for (let n = 1; n <= N; n++) {
    Sch[n][0] = Sch[n - 1][0] * (2 * n - 1) / n;
    for (let m = 1; m <= n; m++) Sch[n][m] = Sch[n][m - 1] * Math.sqrt((n - m + 1) * (m === 1 ? 2 : 1) / (n + m));
  }
  return { N, G, Hh, GD, HD, Sch };
})();
/* Returns { decl, incl, X, Y, Z } — declination in degrees, east positive. */
function wmmField(latDeg, lonDeg, hKm, year) {
  const d2r = Math.PI / 180, { N, G, Hh, GD, HD, Sch } = WMM;
  const A = 6378.137, f = 1 / 298.257223563, e2 = f * (2 - f), RE = 6371.2;
  const phi = latDeg * d2r, lam = lonDeg * d2r, sp = Math.sin(phi), cp = Math.cos(phi);
  const Rc = A / Math.sqrt(1 - e2 * sp * sp);
  const p = (Rc + hKm) * cp, z = (Rc * (1 - e2) + hKm) * sp, r = Math.hypot(p, z);
  const phic = Math.asin(z / r);
  const ct = Math.sin(phic), st = Math.max(1e-9, Math.cos(phic));   // colatitude cos/sin
  const dt = year - WMM_EPOCH;
  const P = [], dP = [];
  for (let n = 0; n <= N; n++) { P.push(new Float64Array(n + 1)); dP.push(new Float64Array(n + 1)); }
  P[0][0] = 1; dP[0][0] = 0;
  for (let n = 1; n <= N; n++) {
    for (let m = 0; m <= n; m++) {
      if (n === m) { P[n][m] = st * P[n - 1][m - 1]; dP[n][m] = st * dP[n - 1][m - 1] + ct * P[n - 1][m - 1]; }
      else {
        const K = n > 1 ? ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3)) : 0;
        const p2 = m <= n - 2 ? P[n - 2][m] : 0, d2 = m <= n - 2 ? dP[n - 2][m] : 0;
        P[n][m] = ct * P[n - 1][m] - K * p2;
        dP[n][m] = ct * dP[n - 1][m] - st * P[n - 1][m] - K * d2;
      }
    }
  }
  let X = 0, Y = 0, Z = 0;
  for (let n = 1; n <= N; n++) {
    const ar = Math.pow(RE / r, n + 2);
    for (let m = 0; m <= n; m++) {
      const g = (G[n][m] + dt * GD[n][m]) * Sch[n][m], h = (Hh[n][m] + dt * HD[n][m]) * Sch[n][m];
      const cm = Math.cos(m * lam), sm = Math.sin(m * lam);
      X += ar * (g * cm + h * sm) * dP[n][m];
      Y += ar * m * (g * sm - h * cm) * P[n][m];
      Z -= (n + 1) * ar * (g * cm + h * sm) * P[n][m];
    }
  }
  Y /= st;
  const psi = phic - phi;                                    // geocentric -> geodetic
  const Xg = X * Math.cos(psi) - Z * Math.sin(psi), Zg = X * Math.sin(psi) + Z * Math.cos(psi);
  return { decl: Math.atan2(Y, Xg) / d2r, incl: Math.atan2(Zg, Math.hypot(Xg, Y)) / d2r, X: Xg, Y, Z: Zg };
}
