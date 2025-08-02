import { createSpinGenerator } from './random';

let spinGenerator = null;

export const initSpinGenerator = (config) => {
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
    slotCenterAngle: spinResult.slotCenterAngle,
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
    totalDuration: 8000,        // Общая длительность анимации
    accelerationTime: 2000,     // Время разгона
    maxSpeedTime: 3000,         // Время на максимальной скорости
    decelerationTime: 3000,     // Время торможения
    maxVelocity: 20,            // Максимальная скорость (градусы в секунду)
  };

  const easeInOut = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    if (!lastTimestamp) lastTimestamp = timestamp;

    const elapsed = timestamp - startTime;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Простая логика: используем easing функцию для всей анимации
    const progress = Math.min(elapsed / animationConfig.totalDuration, 1);
    const easedProgress = easeInOut(progress);
    
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
  
  // Нормализуем угол
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // В createWheel.js слот 0 начинается с угла -90° (что равно 270°)
  // Центр слота i находится на угле: 270° + i * slotAngle
  // Указатель находится на 270°
  
  // Находим какой слот находится под указателем
  // Добавляем 90° чтобы привести к стандартной системе (где 0° = верх)
  const adjustedAngle = (normalizedAngle + 90) % 360;
  const slotIndex = Math.floor(adjustedAngle / slotAngle) % generator.slots;
  
  console.log('🧮 Расчет слота:', {
    originalAngle: angle,
    normalizedAngle: normalizedAngle.toFixed(2),
    adjustedAngle: adjustedAngle.toFixed(2),
    slotAngle: slotAngle.toFixed(2),
    calculatedSlot: slotIndex,
    totalSlots: generator.slots
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