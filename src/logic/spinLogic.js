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
  
  // Вызываем callback после генерации результата
  if (onGenerate) {
    onGenerate(spinResult);
  }

  let animationId = null;
  let currentAngle = currentRotation;
  let velocity = 0;
  let startTime = null;
  let lastTimestamp = null;

  const animationConfig = {
    accelerationTime: 800,
    maxSpeedTime: 1500,
    decelerationTime: 2500 + Math.random() * 1500,
    maxVelocity: 25 + Math.random() * 10,
    finalAdjustmentSpeed: 0.08,
    precisionThreshold: 0.5
  };

  const easeInCubic = (t) => t * t * t;
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    if (!lastTimestamp) lastTimestamp = timestamp;

    const elapsed = timestamp - startTime;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    let targetVelocity = 0;
    const targetRotation = currentRotation + spinResult.totalRotation;

    if (elapsed < animationConfig.accelerationTime) {
      const progress = elapsed / animationConfig.accelerationTime;
      targetVelocity = animationConfig.maxVelocity * easeInCubic(progress);
    } 
    else if (elapsed < animationConfig.accelerationTime + animationConfig.maxSpeedTime) {
      targetVelocity = animationConfig.maxVelocity;
    } 
    else {
      const decelerationElapsed = elapsed - animationConfig.accelerationTime - animationConfig.maxSpeedTime;
      const decelerationProgress = Math.min(decelerationElapsed / animationConfig.decelerationTime, 1);
      targetVelocity = animationConfig.maxVelocity * (1 - easeOutQuart(decelerationProgress));
      
      // Финальная точная подстройка к целевому углу
      if (targetVelocity < 3) {
        const remainingAngle = targetRotation - currentAngle;
        if (Math.abs(remainingAngle) > animationConfig.precisionThreshold) {
          targetVelocity = Math.max(0.1, Math.abs(remainingAngle) * animationConfig.finalAdjustmentSpeed);
          // Учитываем направление доворота
          if (remainingAngle < 0) targetVelocity = -targetVelocity;
        } else {
          // Достигли целевого угла с нужной точностью
          currentAngle = targetRotation;
          finishSpin();
          return;
        }
      }
    }

    const velocityDiff = targetVelocity - velocity;
    velocity += velocityDiff * 0.08; // Более плавное изменение скорости
    currentAngle += velocity * (deltaTime / 16.67);
    
    // Обновляем UI
    if (onUpdate) {
      onUpdate(currentAngle);
    }
    
    animationId = requestAnimationFrame(animate);
  };

  const finishSpin = () => {
    cancelAnimationFrame(animationId);
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    const winningIndex = calculateWinningSlot(normalizedAngle, resultGenerator);

    console.log('🎯 Результат спина:', {
      'Ожидаемый слот': spinResult.targetSlot,
      'Фактический слот': winningIndex,
      'Финальный угол': normalizedAngle.toFixed(2),
      'Общий поворот': spinResult.totalRotation.toFixed(2),
      'Текущий угол': currentAngle.toFixed(2),
      'Разница углов': (normalizedAngle - spinResult.targetAngle).toFixed(2),
      'Ожидаемый targetAngle': spinResult.targetAngle.toFixed(2),
      'Совпадение': spinResult.targetSlot === winningIndex ? '✅' : '❌'
    });

    // Дополнительная отладка для понимания позиций слотов
    const slotAngle = resultGenerator.slotAngle;
    const visualOffset = resultGenerator.visualOffset || -90;
    console.log('📍 Позиции слотов:', {
      'Слот 0': `${visualOffset}° (${(visualOffset + 360) % 360}°)`,
      'Слот 1': `${(visualOffset + slotAngle) % 360}°`,
      'Слот 2': `${(visualOffset + 2 * slotAngle) % 360}°`,
      'Слот 18': `${(visualOffset + 18 * slotAngle) % 360}°`,
      'Указатель': `${resultGenerator.pointerPosition}°`
    });

    if (onComplete) {
      onComplete(currentAngle, winningIndex, spinResult.prize);
    }
  };

  animationId = requestAnimationFrame(animate);

  return {
    cancel: () => {
      if (animationId) cancelAnimationFrame(animationId);
    },
    result: spinResult
  };
};

export function calculateWinningSlot(angle, generator) {
  const slotAngle = generator.slotAngle;
  const pointerPosition = generator.pointerPosition;
  const slots = generator.slots;
  const visualOffset = generator.visualOffset || -90; // Слот 0 внизу = -90°
  
  // Нормализуем текущий угол колеса (0-360)
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // Пробуем инвертировать направление - если CSS вращает по часовой,
  // а наша логика против часовой, то нужно инвертировать
  
  // Угол слота под указателем после поворота колеса на normalizedAngle
  // Инвертируем направление: вместо (pointerPosition - normalizedAngle)
  // используем (pointerPosition + normalizedAngle)
  let slotAngleUnderPointer = (pointerPosition + normalizedAngle) % 360;
  
  // Корректируем для учета того, что слот 0 находится в позиции -90° (270°)
  // Переводим угол в систему координат слотов
  const adjustedAngle = (slotAngleUnderPointer - visualOffset + 360) % 360;
  
  // Рассчитываем индекс слота
  const slotIndex = Math.floor(adjustedAngle / slotAngle) % slots;
  
  // Отладочная информация
  console.log('🧮 Расчет слота (инвертированное направление):', {
    normalizedAngle: normalizedAngle.toFixed(2),
    slotAngleUnderPointer: slotAngleUnderPointer.toFixed(2),
    adjustedAngle: adjustedAngle.toFixed(2),
    slotAngle: slotAngle.toFixed(2),
    calculatedSlot: slotIndex,
    pointerPosition: pointerPosition,
    visualOffset: visualOffset,
    totalSlots: slots
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