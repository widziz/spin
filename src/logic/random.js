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
    // Учитываем смещение визуального представления (слот 0 внизу = -90°)
    this.visualOffset = -90;
  }

  generate(options = {}) {
    const targetSlot = options.guaranteed !== undefined ? options.guaranteed : Random.int(0, this.slots - 1);
    const rotations = Random.between(5, 8);
    
    // Рассчитываем целевой угол так, чтобы указатель указывал на нужный слот
    // Слот 0 находится внизу (-90°), слоты идут по часовой стрелке
    const slotCenterAngle = targetSlot * this.slotAngle + this.visualOffset;
    
    // Поскольку и указатель (270°) и слот 0 (-90° = 270°) находятся внизу,
    // для попадания в слот 0 колесо не должно поворачиваться (targetAngle = 0)
    // Для других слотов нужен поворот
    let targetAngle = (this.pointerPosition - slotCenterAngle + 360) % 360;
    
    const totalRotation = rotations * 360 + targetAngle;

    console.log('🎲 Генерируем результат:', {
      targetSlot,
      totalRotation,
      targetAngle,
      slotCenterAngle,
      slotPositionDegrees: slotCenterAngle,
      currentRotation: 0
    });

    return {
      targetSlot,
      rotations,
      totalRotation,
      targetAngle,
      slotCenterAngle,
      prize: this.prizes[targetSlot % this.prizes.length],
      slotAngle: this.slotAngle,
      id: `spin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }
}

export const createSpinGenerator = (config) => new SpinResultGenerator(config);