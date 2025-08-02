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
    
    // В createWheel.js слоты создаются с углом: i * angleStep - Math.PI/2
    // Это означает что слот 0 находится внизу (270°), слот slots/4 справа (0°) и т.д.
    // Центр слота i находится на угле: (targetSlot * slotAngle - 90) градусов
    const slotCenterAngle = (targetSlot * this.slotAngle - 90 + 360) % 360;
    
    // Указатель находится на 270° (внизу)
    // Чтобы указатель указывал на слот, нужно повернуть колесо так, 
    // чтобы slotCenterAngle оказался на позиции указателя (270°)
    let targetAngle = (270 - slotCenterAngle + 360) % 360;
    
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