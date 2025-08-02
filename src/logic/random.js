export const Random = {
  between: (min, max) => Math.random() * (max - min) + min,
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

export class SpinResultGenerator {
  constructor(config) {
    this.slots = config.slots || 12;
    this.prizes = config.prizes || [];
    // Указатель находится внизу колеса (270 градусов от верха по часовой стрелке)
    this.pointerPosition = config.pointerPosition || 270;
    this.slotAngle = 360 / this.slots;
  }

  generate(options = {}) {
    const targetSlot = options.guaranteed !== undefined ? options.guaranteed : Random.int(0, this.slots - 1);
    const rotations = Random.between(5, 8);
    
    // Слоты нумеруются от 0 по часовой стрелке, начиная с верха (0°)
    // Центр слота находится на угле: targetSlot * slotAngle
    const slotCenterAngle = targetSlot * this.slotAngle;
    
    // Для того чтобы указатель (270°) указывал точно на центр целевого слота,
    // нужно повернуть колесо так, чтобы центр слота оказался под указателем
    // Финальный угол = slotCenterAngle - pointerPosition + 360n
    let targetAngle = slotCenterAngle - this.pointerPosition;
    
    // Нормализуем угол в диапазон [0, 360)
    while (targetAngle < 0) targetAngle += 360;
    while (targetAngle >= 360) targetAngle -= 360;
    
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