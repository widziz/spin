// VERSION: 2024-01-18-FIXED
import { createSpinGenerator } from './random';

let spinGenerator = null;

export const initSpinGenerator = (config) => {
  console.log('🔧 Инициализация генератора (версия 2024-01-18-FIXED):', config);
  spinGenerator = createSpinGenerator(config);
  return spinGenerator;
};

export const startSpinAdvanced = ({
  currentRotation = 0,
  slots = 12,
  prizes = [],
  generator = null,
  generateOptions = {},
  onGenerate,
  onUpdate,
  onComplete
}) => {
  const resultGenerator = generator || spinGenerator;
  if (!resultGenerator) {
    throw new Error('Spin generator not initialized. Call initSpinGenerator() first.');
  }

  const spinResult = resultGenerator.generate(generateOptions);
  
  console.log('🎲 Генерируем результат:', {
    targetSlot: spinResult.targetSlot,
    totalRotation: spinResult.totalRotation,
    targetAngle: spinResult.targetAngle,
    slotCenterAngleDegrees: spinResult.slotCenterAngleDegrees,
    pointerPosition: spinResult.pointerPosition,
    currentRotation
  });
  
  // Вызываем callback после генерации результата
  if (onGenerate) {
    onGenerate(spinResult);
  }

  let animationId = null;
  let currentAngle = currentRotation;
  let velocity = 0;
  let startTime = null;
  let lastTimestamp = null;

  // Цель анимации - достичь этого угла
  const targetFinalAngle = currentRotation + spinResult.totalRotation;

  const animationConfig = {
    totalDuration: 6000,        // Общая длительность анимации
    accelerationTime: 1000,     // Время разгона
    maxSpeedTime: 2000,         // Время на максимальной скорости
    decelerationTime: 3000,     // Время торможения
    maxVelocity: 20,            // Максимальная скорость (градусы в секунду)
  };

  // Более реалистичная easing функция
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    if (!lastTimestamp) lastTimestamp = timestamp;

    const elapsed = timestamp - startTime;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Используем более сложную easing функцию с фазами
    let progress = Math.min(elapsed / animationConfig.totalDuration, 1);
    
    // Модифицируем прогресс для создания эффекта ускорения и замедления
    let easedProgress;
    if (elapsed < animationConfig.accelerationTime) {
      // Фаза ускорения
      const accelProgress = elapsed / animationConfig.accelerationTime;
      easedProgress = 0.1 * easeInOutCubic(accelProgress);
    } else if (elapsed < animationConfig.accelerationTime + animationConfig.maxSpeedTime) {
      // Фаза постоянной скорости
      const constProgress = (elapsed - animationConfig.accelerationTime) / animationConfig.maxSpeedTime;
      easedProgress = 0.1 + 0.7 * constProgress;
    } else {
      // Фаза замедления
      const decelProgress = (elapsed - animationConfig.accelerationTime - animationConfig.maxSpeedTime) / animationConfig.decelerationTime;
      easedProgress = 0.8 + 0.2 * easeInOutCubic(decelProgress);
    }
    
    // Рассчитываем текущий угол на основе прогресса
    const newAngle = currentRotation + (spinResult.totalRotation * easedProgress);
    currentAngle = newAngle;
    
    // Обновляем UI
    if (onUpdate) {
      onUpdate(currentAngle);
    }
    
    // Проверяем завершение анимации
    if (progress >= 1) {
      currentAngle = targetFinalAngle;
      finishSpin();
      return;
    }
    
    animationId = requestAnimationFrame(animate);
  };

  const finishSpin = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const winningIndex = calculateWinningSlot(normalizedAngle, resultGenerator);

    console.log('🎯 Результат спина:', {
      'Ожидаемый слот': spinResult.targetSlot,
      'Фактический слот': winningIndex,
      'Финальный угол': normalizedAngle.toFixed(2),
      'Общий поворот': spinResult.totalRotation.toFixed(2),
      'Текущий угол': currentAngle.toFixed(2),
      'Целевой угол': targetFinalAngle.toFixed(2)
    });

    if (onComplete) {
      onComplete(currentAngle, winningIndex, spinResult.prize);
    }
  };

  animationId = requestAnimationFrame(animate);

  return {
    cancel: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    result: spinResult
  };
};

export function calculateWinningSlot(angle, generator) {
  const slotAngle = generator.slotAngle;
  
  // Нормализуем угол колеса
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // Из createSector.js: centerAngle = slotIndex * angleStep - π/2
  // В градусах: slotCenterAngle = slotIndex * slotAngle - 90
  // Решаем обратную задачу: slotIndex = (slotCenterAngle + 90) / slotAngle
  
  // Указатель находится на 270°, найдем какой угол слота находится под ним
  const angleUnderPointer = (normalizedAngle + 270) % 360;
  
  // Переводим в индекс слота
  const slotIndex = Math.floor((angleUnderPointer + 90) / slotAngle) % generator.slots;
  
  console.log('🧮 Расчет слота:', {
    originalAngle: angle,
    normalizedAngle: normalizedAngle.toFixed(2),
    angleUnderPointer: angleUnderPointer.toFixed(2),
    slotAngle: slotAngle.toFixed(2),
    calculatedSlot: slotIndex,
    totalSlots: generator.slots,
    formula: `floor((${angleUnderPointer.toFixed(2)} + 90) / ${slotAngle.toFixed(2)}) % ${generator.slots}`
  });
  
  return slotIndex;
}

export const startSpinSimple = (options) => {
  const { generator, ...rest } = options;
  const result = generator ? generator.generate() : { targetSlot: 0, rotations: 5 };
  return startSpinAdvanced({
    ...rest,
    generateOptions: { guaranteed: result.targetSlot }
  });
};