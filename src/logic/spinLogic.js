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
    finalAdjustmentSpeed: 0.08
  };

  const easeInCubic = (t) => t * t * t;
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    if (!lastTimestamp) lastTimestamp = timestamp;

    const elapsed = timestamp - startTime;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    let targetVelocity = 0;

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
      targetVelocity = animationConfig.maxVelocity * (1 - easeOutQuint(decelerationProgress));
      
      if (targetVelocity < 1.5) {
        const targetRotation = currentRotation + spinResult.totalRotation;
        const remainingAngle = targetRotation - currentAngle;
        if (remainingAngle > 0.5) {
          targetVelocity = Math.max(0.05, remainingAngle * animationConfig.finalAdjustmentSpeed);
        } else {
          currentAngle = targetRotation;
          finishSpin();
          return;
        }
      }
    }

    const velocityDiff = targetVelocity - velocity;
    const interpolationFactor = Math.min(deltaTime / 16.67 * 0.15, 0.8);
    velocity += velocityDiff * interpolationFactor;
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

    console.log('🎯 Результат вращения:', {
      'Ожидаемый слот': spinResult.targetSlot,
      'Фактический слот': winningIndex,
      'Финальный угол': normalizedAngle.toFixed(2) + '°',
      'Общий поворот': spinResult.totalRotation.toFixed(2) + '°',
      'Угол под указателем': ((resultGenerator.pointerPosition + normalizedAngle) % 360).toFixed(2) + '°',
      'Совпадение': spinResult.targetSlot === winningIndex ? '✅ ДА' : '❌ НЕТ'
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
  
  // Нормализуем угол поворота колеса в диапазон [0, 360)
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // Вычисляем абсолютный угол под указателем
  // Указатель находится на фиксированной позиции (270°), 
  // а колесо поворачивается на normalizedAngle
  const absoluteAngleUnderPointer = (pointerPosition + normalizedAngle) % 360;
  
  // Определяем индекс слота под указателем
  // Слоты нумеруются от 0 по часовой стрелке, начиная с верха (0°)
  const slotIndex = Math.floor(absoluteAngleUnderPointer / slotAngle) % generator.slots;
  
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