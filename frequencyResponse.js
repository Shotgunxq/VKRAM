// frequencyResponse.js

function calculateFrequencyResponse(K, T1, n, omega) {
  const real = 1;
  const imag = omega * T1;

  const magnitude = Math.pow(real * real + imag * imag, n / 2);
  const phase = n * Math.atan2(imag, real);

  return {
    magnitude: K / magnitude,
    magnitudeDB: 20 * Math.log10(K / magnitude),
    phaseRad: -phase,
    phaseDeg: (-phase * 180) / Math.PI,
    real: (K / magnitude) * Math.cos(-phase),
    imag: (K / magnitude) * Math.sin(-phase),
  };
}

function getAsymptoticApproximation(K, T1, n, omega) {
  const cornerFreq = 1 / T1;
  let magnitudeDB, phaseDeg;

  if (omega < cornerFreq / 10) {
    magnitudeDB = 20 * Math.log10(K);
    phaseDeg = 0;
  } else if (omega > cornerFreq * 10) {
    magnitudeDB = 20 * Math.log10(K) - 20 * n * Math.log10(omega / cornerFreq);
    phaseDeg = -90 * n;
  } else {
    const logOmega = Math.log10(omega);
    const logCornerFreq = Math.log10(cornerFreq);
    const t = (logOmega - logCornerFreq + 1) / 2;

    magnitudeDB =
      20 * Math.log10(K) - 20 * n * Math.log10(omega / cornerFreq) * t;
    phaseDeg = -90 * n * t;
  }

  return { magnitudeDB, phaseDeg };
}

function generateFrequencyArray(
  minPower = -2,
  maxPower = 4,
  pointsPerDecade = 50
) {
  const frequencies = [];
  const totalPoints = (maxPower - minPower) * pointsPerDecade;

  for (let i = 0; i < totalPoints; i++) {
    const logOmega = minPower + i / pointsPerDecade;
    frequencies.push(Math.pow(10, logOmega));
  }

  return frequencies;
}

function calculateAndPlot() {
  const K = parseFloat(document.getElementById("gainK").value);
  const T1 = parseFloat(document.getElementById("timeConstantT1").value);
  const n = parseInt(document.getElementById("orderN").value);

  if (isNaN(K) || isNaN(T1) || isNaN(n) || K <= 0 || T1 <= 0 || n < 1) {
    alert("Zadaj platné hodnoty!");
    return;
  }

  const frequencies = generateFrequencyArray();

  const bodeMagnitudeExact = [];
  const bodePhaseExact = [];
  const bodeMagnitudeAsymptotic = [];
  const bodePhaseAsymptotic = [];

  frequencies.forEach((omega) => {
    const exact = calculateFrequencyResponse(K, T1, n, omega);
    bodeMagnitudeExact.push(exact.magnitudeDB);
    bodePhaseExact.push(exact.phaseDeg);

    const asymptotic = getAsymptoticApproximation(K, T1, n, omega);
    bodeMagnitudeAsymptotic.push(asymptotic.magnitudeDB);
    bodePhaseAsymptotic.push(asymptotic.phaseDeg);
  });

  // Vykresli jednotlivé grafy
  plotBodeMagnitude(frequencies, bodeMagnitudeExact, bodeMagnitudeAsymptotic);
  plotBodePhase(frequencies, bodePhaseExact, bodePhaseAsymptotic);
  plotNyquistDiagram(frequencies, K, T1, n);
}

function plotBodeMagnitude(frequencies, magExact, magAsymptotic) {
  const freqLog = frequencies.map((f) => Math.log10(f));

  const traceMagnitudeExact = {
    x: freqLog,
    y: magExact,
    mode: "lines",
    name: "Presná charakteristika",
    line: { color: "#2196F3", width: 2 },
  };

  const traceMagnitudeAsymptotic = {
    x: freqLog,
    y: magAsymptotic,
    mode: "lines",
    name: "Asymptotická aproximácia",
    line: { color: "#FF5252", dash: "dash", width: 2 },
  };

  const layout = {
    title: false,
    xaxis: {
      title: "log₁₀(ω) [rad/s]",
      gridcolor: "#e0e0e0",
    },
    yaxis: {
      title: "Veľkosť [dB]",
      gridcolor: "#e0e0e0",
    },
    hovermode: "x unified",
    margin: { l: 60, r: 20, t: 20, b: 50 },
    plot_bgcolor: "#fafafa",
    paper_bgcolor: "white",
  };

  Plotly.newPlot(
    "bodeMagnitudePlot",
    [traceMagnitudeExact, traceMagnitudeAsymptotic],
    layout,
    { responsive: true }
  );
}

function plotBodePhase(frequencies, phaseExact, phaseAsymptotic) {
  const freqLog = frequencies.map((f) => Math.log10(f));

  const tracePhaseExact = {
    x: freqLog,
    y: phaseExact,
    mode: "lines",
    name: "Presná charakteristika",
    line: { color: "#4CAF50", width: 2 },
  };

  const tracePhaseAsymptotic = {
    x: freqLog,
    y: phaseAsymptotic,
    mode: "lines",
    name: "Asymptotická aproximácia",
    line: { color: "#FFC107", dash: "dash", width: 2 },
  };

  const layout = {
    title: false,
    xaxis: {
      title: "log₁₀(ω) [rad/s]",
      gridcolor: "#e0e0e0",
    },
    yaxis: {
      title: "Fáza [°]",
      gridcolor: "#e0e0e0",
    },
    hovermode: "x unified",
    margin: { l: 60, r: 20, t: 20, b: 50 },
    plot_bgcolor: "#fafafa",
    paper_bgcolor: "white",
  };

  Plotly.newPlot(
    "bodePhasePlot",
    [tracePhaseExact, tracePhaseAsymptotic],
    layout,
    { responsive: true }
  );
}

function plotNyquistDiagram(frequencies, K, T1, n) {
  const realParts = [];
  const imagParts = [];

  frequencies.forEach((omega) => {
    const response = calculateFrequencyResponse(K, T1, n, omega);
    realParts.push(response.real);
    imagParts.push(response.imag);
  });

  const traceNyquist = {
    x: realParts,
    y: imagParts,
    mode: "lines",
    name: "G(jω)",
    line: { color: "#9C27B0", width: 2.5 },
    hovertemplate:
      "<b>G(jω)</b><br>Re: %{x:.4f}<br>Im: %{y:.4f}<extra></extra>",
  };

  // Jednotková kružnica
  const circle = generateCircle(1, 100);
  const traceCircle = {
    x: circle.real,
    y: circle.imag,
    mode: "lines",
    name: "Jednotková kružnica",
    line: { color: "#ccc", dash: "dot", width: 1.5 },
    hoverinfo: "skip",
  };

  const layout = {
    title: false,
    xaxis: {
      title: "Reálna časť",
      gridcolor: "#e0e0e0",
      zeroline: true,
      zerolinecolor: "#999",
    },
    yaxis: {
      title: "Imaginárna časť",
      gridcolor: "#e0e0e0",
      zeroline: true,
      zerolinecolor: "#999",
    },
    hovermode: "closest",
    margin: { l: 60, r: 20, t: 20, b: 50 },
    plot_bgcolor: "#fafafa",
    paper_bgcolor: "white",
    width: 500,
    height: 500,
    xaxis: { scaleanchor: "y", scaleratio: 1 },
    yaxis: { scaleanchor: "x", scaleratio: 1 },
  };

  Plotly.newPlot("nyquistPlot", [traceNyquist, traceCircle], layout, {
    responsive: true,
  });
}

function generateCircle(radius, points) {
  const real = [];
  const imag = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    real.push(radius * Math.cos(angle));
    imag.push(radius * Math.sin(angle));
  }

  return { real, imag };
}

// Automatické vykresľovanie pri načítaní
window.onload = () => calculateAndPlot();
