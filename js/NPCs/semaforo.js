/**
 * Verifica se existe um semáforo ferroviário vermelho à frente do veículo.
 * A lógica foi extraída de vehicleNPC.js para manter a responsabilidade
 * do semáforo separada da movimentação dos carros.
 */
export function isRedRailwaySignalAhead(
  signals,
  point,
  forwardX,
  forwardZ
) {
  return signals.some(signal => {
    if (!signal.red) return false;

    const signalRelativeX =
      signal.x - point.x;

    const signalRelativeZ =
      signal.z - point.z;

    const signalAhead =
      signalRelativeX * forwardX +
      signalRelativeZ * forwardZ;

    const signalSide =
      Math.abs(
        signalRelativeX * forwardZ -
        signalRelativeZ * forwardX
      );

    return (
      signalAhead > -4 &&
      signalAhead < 48 &&
      signalSide < 13
    );
  });
}
