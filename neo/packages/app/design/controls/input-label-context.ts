import { createContext } from 'react';

/**
 * True inside a form field whose adaptive label floats inside the input
 * (`theme.inputs.adaptive_label_inside_sizes`). The input then moves its text
 * below the floated label (`adaptive_input_inside`).
 */
export const InputLabelInsideContext = createContext(false);
