export const Random = {
  between: (min, max) => Math.random() * (max - min) + min,
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

export class SpinResultGenerator {
  constructor(config) {
    this.slots = config.slots || 12;
    this.prizes = config.prizes || [];
    this.pointerPosition = 270;
    this.initialSlot = 10;
    this.slotAngle = 360 / this.slots;
    this.slotOffset = this.initialSlot * this.slotAngle;
  }

  generate(options = {}) {
    const targetSlot = options.guaranteed !== undefined ? options.guaranteed : Random.int(0, this.slots - 1);
    const rotations = Random.between(5, 8);
    const targetAngle = (targetSlot * this.slotAngle + this.slotOffset + this.pointerPosition) % 360;
    const totalRotation = rotations * 360 + targetAngle;

    return {
      targetSlot,
      rotations,
      totalRotation,
      prize: this.prizes[targetSlot % this.prizes.length],
      slotAngle: this.slotAngle,
      id: `spin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }
}

export const createSpinGenerator = (config) => new SpinResultGenerator(config);