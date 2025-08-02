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

  // Цель анимации - достичь этого угла
  const targetFinalAngle = currentRotation + spinResult.totalRotation;

  const animationConfig = {
    accelerationTime: 1500,      // Увеличиваем время разгона
    maxSpeedTime: 2000,          // Время на максимальной скорости
    decelerationTime: 4000,      // Увеличиваем время торможения
    maxVelocity: 25 + Math.random() * 10, // Максимальная скорость
    finalAdjustmentSpeed: 0.05,  // Скорость финальной подгонки
    minAnimationTime: 6000       // Минимальное время анимации
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

    // Проверяем минимальное время анимации
    const minTimeElapsed = elapsed >= animationConfig.minAnimationTime;
    const remainingDistance = Math.abs(targetFinalAngle - currentAngle);

    if (elapsed < animationConfig.accelerationTime) {
      // Фаза разгона
      const progress = elapsed / animationConfig.accelerationTime;
      targetVelocity = animationConfig.maxVelocity * easeInCubic(progress);
    } 
    else if (elapsed < animationConfig.accelerationTime + animationConfig.maxSpeedTime) {
      // Фаза максимальной скорости
      targetVelocity = animationConfig.maxVelocity;
    } 
    else {
      // Фаза торможения
      const decelerationElapsed = elapsed - animationConfig.accelerationTime - animationConfig.maxSpeedTime;
      const decelerationProgress = Math.min(decelerationElapsed / animationConfig.decelerationTime, 1);
      targetVelocity = animationConfig.maxVelocity * (1 - easeOutQuart(decelerationProgress));
      
      // Финальная подгонка только если прошло минимальное время
      if (targetVelocity < 2 && minTimeElapsed) {
        if (remainingDistance > 2) {
          targetVelocity = Math.max(0.1, remainingDistance * animationConfig.finalAdjustmentSpeed);
        } else {
          // Анимация завершена
          currentAngle = targetFinalAngle;
          finishSpin();
          return;
        }
      }
    }

    const velocityDiff = targetVelocity - velocity;
    velocity += velocityDiff * 0.08; // Немного замедляем изменение скорости
    currentAngle += velocity * (deltaTime / 16.67);
    
    // Обновляем UI
    if (onUpdate) {
      onUpdate(currentAngle);
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
      'Текущий угол': currentAngle.toFixed(2)
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
  const pointerPosition = generator.pointerPosition;
  
  // Нормализуем угол
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // Рассчитываем какой слот находится под указателем
  // Указатель находится на pointerPosition градусах, найдем слот под ним
  const angleUnderPointer = (normalizedAngle + pointerPosition) % 360;
  const slotIndex = Math.floor(angleUnderPointer / slotAngle) % generator.slots;
  
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