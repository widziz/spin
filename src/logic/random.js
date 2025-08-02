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
    
    // Рассчитываем целевой угол так, чтобы указатель указывал на нужный слот
    // Угол слота относительно центра (0 градусов = верх, увеличивается по часовой стрелке)
    const slotCenterAngle = targetSlot * this.slotAngle;
    
    // Чтобы указатель (270°) указывал на слот, колесо должно повернуться так,
    // чтобы слот оказался на позиции указателя
    // Формула: угол_поворота = (позиция_указателя - угол_слота) % 360
    let targetAngle = (this.pointerPosition - slotCenterAngle) % 360;
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