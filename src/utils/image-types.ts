import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const CARD_WIDTH = width * 0.3;
export const IMAGE_SIZE = CARD_WIDTH;

// Background = largura total, altura quadrada (1:1)
export const IMAGE_SIZE_BACKGROUND = width; // quadrado perfeito
