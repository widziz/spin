export const Random = {
  between: (min, max) => Math.random() * (max - min) + min,
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

export class SpinResultGenerator {
  constructor(config) {
    this.slots = config.slots || 12;
    this.prizes = config.prizes || [];
    // Указатель находится внизу колеса (270 градусов)
    this.pointerPosition = config.pointerPosition || 270;
    // Начальный слот (где указатель указывает при угле 0)
    this.initialSlot = config.initialSlot || 0;
    this.slotAngle = 360 / this.slots;
    this.slotOffset = this.initialSlot * this.slotAngle;
  }

  generate(options = {}) {
    const targetSlot = options.guaranteed !== undefined ? options.guaranteed : Random.int(0, this.slots - 1);
    const rotations = Random.between(5, 8);
    
    // Рассчитываем целевой угол так, чтобы указатель указывал на нужный слот
    // Угол слота относительно центра (0 градусов = верх)
    const slotCenterAngle = targetSlot * this.slotAngle;
    
    // Чтобы указатель (270°) указывал на слот, колесо должно повернуться на:
    // (270° - slotCenterAngle) для совмещения указателя с центром слота
    let targetAngle = (this.pointerPosition - slotCenterAngle) % 360;
    if (targetAngle < 0) targetAngle += 360;
    
    const totalRotation = rotations * 360 + targetAngle;

    return {
      targetSlot,
      rotations,
      totalRotation,
      targetAngle,
      prize: this.prizes[targetSlot % this.prizes.length],
      slotAngle: this.slotAngle,
      id: `spin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }
}

export const createSpinGenerator = (config) => new SpinResultGenerator(config);