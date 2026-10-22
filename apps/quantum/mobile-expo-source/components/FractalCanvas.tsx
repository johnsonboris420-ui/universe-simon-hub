import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import {
  ColorScheme,
  FractalParams,
  FractalType,
  getColor,
  iterateBurningShip,
  iterateJulia,
  iterateMandelbrot,
  iterateNewton,
} from "@/utils/fractal";

interface FractalCanvasProps {
  params: FractalParams;
  onParamsChange?: (partial: Partial<FractalParams>) => void;
  size?: number;
  readonly?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TILE_SIZE = 8;

interface ColoredTile {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
}

function computePixel(
  px: number,
  py: number,
  type: FractalType,
  params: FractalParams
): number {
  switch (type) {
    case "mandelbrot":
      return iterateMandelbrot(px, py, params.maxIterations);
    case "julia":
      return iterateJulia(
        px,
        py,
        params.juliaReal ?? -0.7269,
        params.juliaImag ?? 0.1889,
        params.maxIterations
      );
    case "burning-ship":
      return iterateBurningShip(px, py, params.maxIterations);
    case "newton": {
      const result = iterateNewton(px, py, params.maxIterations);
      return result.root * (params.maxIterations / 3) + result.iter * 0.1;
    }
  }
}

export function FractalCanvas({
  params,
  onParamsChange,
  size,
  readonly = false,
}: FractalCanvasProps) {
  const canvasSize = size ?? SCREEN_WIDTH;
  const [tiles, setTiles] = useState<ColoredTile[]>([]);
  const [rendering, setRendering] = useState(false);
  const renderIdRef = useRef(0);

  const render = useCallback(async () => {
    renderIdRef.current += 1;
    const currentId = renderIdRef.current;
    setRendering(true);

    const gridW = Math.ceil(canvasSize / TILE_SIZE);
    const gridH = Math.ceil(canvasSize / TILE_SIZE);
    const scale = (3.5 / params.zoom) / canvasSize;
    const newTiles: ColoredTile[] = [];

    const batchSize = Platform.OS === "web" ? 50 : 20;

    for (let gy = 0; gy < gridH; gy++) {
      if (currentId !== renderIdRef.current) {
        setRendering(false);
        return;
      }
      for (let gx = 0; gx < gridW; gx++) {
        const cx = gx * TILE_SIZE + TILE_SIZE / 2;
        const cy = gy * TILE_SIZE + TILE_SIZE / 2;
        const mathX = (cx - canvasSize / 2) * scale + params.centerX;
        const mathY = (cy - canvasSize / 2) * scale + params.centerY;

        const val = computePixel(mathX, mathY, params.type, params);
        const [r, g, b] = getColor(val, params.maxIterations, params.colorScheme);
        newTiles.push({ x: gx * TILE_SIZE, y: gy * TILE_SIZE, r, g, b });
      }

      if (gy % batchSize === 0) {
        const snapshot = [...newTiles];
        setTiles(snapshot);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    if (currentId === renderIdRef.current) {
      setTiles([...newTiles]);
      setRendering(false);
    }
  }, [params, canvasSize]);

  useEffect(() => {
    render();
  }, [render]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !readonly,
    onMoveShouldSetPanResponder: () => !readonly,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gs) => {
      if (!onParamsChange) return;
      const scale = (3.5 / params.zoom) / canvasSize;
      onParamsChange({
        centerX: params.centerX - gs.dx * scale,
        centerY: params.centerY - gs.dy * scale,
      });
    },
  });

  return (
    <View
      style={[styles.canvas, { width: canvasSize, height: canvasSize }]}
      {...(readonly ? {} : panResponder.panHandlers)}
    >
      <Svg width={canvasSize} height={canvasSize}>
        {tiles.map((tile, i) => (
          <Rect
            key={i}
            x={tile.x}
            y={tile.y}
            width={TILE_SIZE}
            height={TILE_SIZE}
            fill={`rgb(${tile.r},${tile.g},${tile.b})`}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: "#000",
    overflow: "hidden",
  },
});
