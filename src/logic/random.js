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
    
    // Рассчитываем целевой угол
    // В createWheel.js слот 0 начинается с угла -90° (270°)
    // Центр каждого слота: слот_i находится на угле (-90° + i * slotAngle)
    const slotCenterAngle = -90 + (targetSlot * this.slotAngle);
    
    // Нормализуем угол слота к диапазону 0-360
    const normalizedSlotAngle = ((slotCenterAngle % 360) + 360) % 360;
    
    // Чтобы указатель (270°) указывал на центр слота, нужно повернуть колесо так,
    // чтобы слот оказался на позиции указателя
    // targetAngle = slotAngle - pointerPosition (но нужно учесть направление вращения)
    let targetAngle = (normalizedSlotAngle - this.pointerPosition) % 360;
    if (targetAngle < 0) targetAngle += 360;
    
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
      slotCenterAngle: normalizedSlotAngle,
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