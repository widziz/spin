// VERSION: 2024-01-18-FIXED
export const Random = {
  between: (min, max) => Math.random() * (max - min) + min,
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

export class SpinResultGenerator {
  constructor(config) {
    this.slots = config.slots || 12;
    this.prizes = config.prizes || [];
    this.pointerPosition = config.pointerPosition || 270; // Указатель внизу
    this.initialSlot = config.initialSlot || 0;
    this.slotAngle = 360 / this.slots;
    
    // Статистика для отслеживания
    this.statistics = {
      totalSpins: 0,
      slotHits: new Array(this.slots).fill(0),
      prizeHits: new Map()
    };
  }

  generate(options = {}) {
    const targetSlot = options.guaranteed !== undefined ? options.guaranteed : Random.int(0, this.slots - 1);
    const rotations = Random.between(5, 8);
    
    // Из createSector.js: centerAngle = slotIndex * angleStep - Math.PI/2
    // angleStep = 2π / totalSlots = this.slotAngle * (π/180)
    // centerAngle для targetSlot в радианах: targetSlot * (2π/slots) - π/2
    // Переводим в градусы: (targetSlot * (360/slots) - 90) 
    const slotCenterAngleDegrees = (targetSlot * this.slotAngle - 90 + 360) % 360;
    
    // Указатель находится на 270°. Чтобы targetSlot оказался под указателем,
    // нужно повернуть колесо так, чтобы центр слота совпал с указателем
    // targetAngle = pointerPosition - slotCenterAngle
    let targetAngle = (this.pointerPosition - slotCenterAngleDegrees + 360) % 360;
    
    const totalRotation = rotations * 360 + targetAngle;

    // Обновляем статистику
    this.statistics.totalSpins++;
    this.statistics.slotHits[targetSlot]++;
    const prize = this.prizes[targetSlot % this.prizes.length];
    if (prize) {
      const prizeKey = `${prize.image}_${prize.value}`;
      this.statistics.prizeHits.set(prizeKey, (this.statistics.prizeHits.get(prizeKey) || 0) + 1);
    }

    return {
      targetSlot,
      rotations,
      totalRotation,
      targetAngle,
      slotCenterAngleDegrees,
      pointerPosition: this.pointerPosition,
      prize,
      slotAngle: this.slotAngle,
      id: `spin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }

  getStatistics() {
    return {
      totalSpins: this.statistics.totalSpins,
      slotHits: [...this.statistics.slotHits],
      prizeHits: Object.fromEntries(this.statistics.prizeHits),
      averageSlot: this.statistics.slotHits.reduce((sum, hits, index) => sum + hits * index, 0) / this.statistics.totalSpins || 0
    };
  }

  resetStatistics() {
    this.statistics.totalSpins = 0;
    this.statistics.slotHits.fill(0);
    this.statistics.prizeHits.clear();
  }
}

export const createSpinGenerator = (config) => new SpinResultGenerator(config);