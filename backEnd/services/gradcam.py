"""
Grad-CAM heatmap generation for nested EfficientNet models.
Uses gradient-based Grad-CAM (same approach as EfficientNet_V2B3_C4 notebook).
"""

import numpy as np
import tensorflow as tf
import cv2


def make_gradcam_heatmap(
    img_array: np.ndarray,
    model: tf.keras.Model,
    last_conv_layer_name: str,
    pred_index=None,
) -> np.ndarray:
    """
    Generate a gradient-based Grad-CAM heatmap matching the C4 notebook approach.
    Uses tf.GradientTape to compute gradient-weighted activations.

    Args:
        img_array: Input image tensor of shape (1, 224, 224, 3)
        model: The full Keras model
        last_conv_layer_name: Name of the last conv layer (inside the backbone)
        pred_index: Not used for regression, kept for API compatibility

    Returns:
        Normalized heatmap as numpy array of shape (H, W) with values in [0, 1]
    """
    # Find the base/backbone model (the nested Functional sub-model)
    base_model = None
    for layer in model.layers:
        if hasattr(layer, "layers") and len(layer.layers) > 10:
            base_model = layer
            break

    if base_model is None:
        return np.ones((7, 7), dtype=np.float32) * 0.5

    # Find the target conv layer inside the base model
    target_layer = None
    for layer in base_model.layers:
        if layer.name == last_conv_layer_name:
            target_layer = layer
            break

    if target_layer is None:
        return np.ones((7, 7), dtype=np.float32) * 0.5

    # Build feature model: backbone input -> last conv layer output
    feature_model = tf.keras.Model(
        inputs=base_model.input,
        outputs=target_layer.output,
    )

    # Build head model: from the layers after the backbone (GAP -> BN -> Dense -> Dropout -> Dense)
    # The head takes the 4D spatial output and produces the final prediction
    head_input = tf.keras.layers.Input(shape=feature_model.output_shape[1:])
    x = head_input
    for layer in model.layers[2:]:  # Skip input layer and backbone
        if isinstance(layer, (tf.keras.layers.Dropout, tf.keras.layers.BatchNormalization)):
            x = layer(x, training=False)
        else:
            x = layer(x)
    head_model = tf.keras.Model(head_input, x, name='gradcam_head')

    # Gradient-based Grad-CAM (same as C4 notebook)
    with tf.GradientTape() as tape:
        last_conv_layer_output = feature_model(img_array)
        tape.watch(last_conv_layer_output)
        preds = head_model(last_conv_layer_output)
        class_channel = preds[:, 0]

    grads = tape.gradient(class_channel, last_conv_layer_output)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output * pooled_grads
    heatmap = tf.reduce_sum(heatmap, axis=-1)
    heatmap = tf.maximum(heatmap, 0)
    heatmap = heatmap / (tf.reduce_max(heatmap) + tf.keras.backend.epsilon())

    return heatmap.numpy()


def generate_gradcam_overlay(
    img_array: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.4,
) -> bytes:
    """
    Overlay a heatmap on the original image and return as JPEG bytes.
    Uses additive blending (same as EfficientNet_V2B3_C4 notebook).

    Args:
        img_array: Original image in RGB format, range [0, 255]
        heatmap: Normalized heatmap array (H, W) with values in [0, 1]
        alpha: Heatmap intensity multiplier

    Returns:
        JPEG-encoded image bytes
    """
    img = np.uint8(img_array)

    # Rescale heatmap to 0-255
    heatmap_uint8 = np.uint8(255 * heatmap)

    # Resize heatmap to match original image dimensions
    heatmap_resized = cv2.resize(heatmap_uint8, (img.shape[1], img.shape[0]))

    # Apply jet colormap (OpenCV outputs BGR)
    jet_bgr = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
    # Convert to RGB to match img_array
    jet_rgb = cv2.cvtColor(jet_bgr, cv2.COLOR_BGR2RGB)

    # Additive blend (same as C4 notebook: jet_heatmap * alpha + img)
    superimposed_img = np.clip(jet_rgb.astype(np.float32) * alpha + img.astype(np.float32), 0, 255).astype(np.uint8)

    # Convert RGB to BGR for JPEG encoding
    superimposed_bgr = cv2.cvtColor(superimposed_img, cv2.COLOR_RGB2BGR)

    # Encode to JPEG bytes in memory
    _, buffer = cv2.imencode('.jpg', superimposed_bgr)
    return buffer.tobytes()
