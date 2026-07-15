"""
Model loader for the prediction pipeline.
Rebuilds model architectures and loads pre-trained weights from .h5 files.
"""

import tensorflow as tf
from tensorflow.keras.applications import EfficientNetV2B3, MobileNetV2
from tensorflow.keras import layers, Model
from keras.src.saving.saving_lib import load_weights_only

from config.settings import GATEKEEPER_MODEL_PATH, PREDICTION_MODEL_PATH


def build_prediction_model() -> Model:
    """
    Rebuild the EfficientNetV2B3 regression model architecture.
    BackEnd needs to rebuild first before it can load those saved weights. 
    """
    base_model = EfficientNetV2B3(
        include_top=False,
        weights=None,
        input_shape=(224, 224, 3),
        include_preprocessing=True,
    )

    inputs = layers.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name="global_average_pooling2d")(x)
    x = layers.BatchNormalization(name="batch_normalization")(x)
    x = layers.Dense(
        256,
        activation="relu",
        kernel_regularizer=tf.keras.regularizers.l2(0.0002),
        name="dense",
    )(x)
    x = layers.Dropout(0.6, name="dropout")(x)
    outputs = layers.Dense(1, activation="linear", name="dense_1")(x)

    return Model(inputs=inputs, outputs=outputs, name="EfficientNetV2B3_C4")


def build_gatekeeper_model() -> Model:
    """
    Rebuild the MobileNetV2 binary classification model architecture.
    Structure: MobileNetV2 (backbone) -> GAP -> Dropout(0.2) -> Dense(1, sigmoid)
    """
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights=None,
    )

    x = base_model.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    predictions = layers.Dense(1, activation="sigmoid")(x)

    return Model(inputs=base_model.input, outputs=predictions)


def load_model() -> Model | None:
    #Build prediction model architecture and load weights
    try:
        print(f"Building prediction model architecture...")
        model = build_prediction_model()
        print(f"  Loading weights from {PREDICTION_MODEL_PATH}...")
        load_weights_only(model, PREDICTION_MODEL_PATH)
        print(f" [OK] Prediction model ready!")
        print(f"  Input shape:  {model.input_shape}")
        print(f"  Output shape: {model.output_shape}")
        return model
    except Exception as e:
        print(f" [ERROR] Failed to load prediction model: {e}")
        import traceback
        traceback.print_exc()
        return None


def load_gatekeeper_model() -> Model | None:
    #Build gatekeeper model architecture and load weights. Returns None on failure."""
    try:
        print(f"Building gatekeeper model architecture...")
        model = build_gatekeeper_model()
        print(f"  Loading weights from {GATEKEEPER_MODEL_PATH}...")
        load_weights_only(model, GATEKEEPER_MODEL_PATH)
        print(f" [OK] Gatekeeper model ready!")
        print(f"  Input shape:  {model.input_shape}")
        print(f"  Output shape: {model.output_shape}")
        return model
    except Exception as e:
        print(f" [ERROR] Failed to load gatekeeper model: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_last_conv_layer_name(model: Model) -> str | None:
    # automatically find the name of the very last 2D Convolutional layer (Conv2D) in a deep learning model
    # different architectures name their final convolutional layers differently , this function helps to find the layer
    for layer in reversed(model.layers):
        if hasattr(layer, "layers"):
            for sub_layer in reversed(layer.layers):
                if isinstance(sub_layer, tf.keras.layers.Conv2D):
                    return sub_layer.name
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    return None
