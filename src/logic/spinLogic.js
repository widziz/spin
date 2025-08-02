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
    accelerationTime: 1000,
    maxSpeedTime: 2000,
    decelerationTime: 3000 + Math.random() * 2000,
    maxVelocity: 30 + Math.random() * 15,
    finalAdjustmentSpeed: 0.15
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
      
      if (targetVelocity < 2) {
        const targetRotation = currentRotation + spinResult.totalRotation;
        const remainingAngle = targetRotation - currentAngle;
        if (remainingAngle > 1) {
          targetVelocity = Math.max(0.1, remainingAngle * animationConfig.finalAdjustmentSpeed);
        } else {
          currentAngle = targetRotation;
          finishSpin();
          return;
        }
      }
    }

    const velocityDiff = targetVelocity - velocity;
    velocity += velocityDiff * 0.1;
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

    console.log('Spin result:', {
      'Expected slot': spinResult.targetSlot,
      'Actual slot': winningIndex,
      'Final angle': normalizedAngle.toFixed(2),
      'Total rotation': spinResult.totalRotation.toFixed(2)
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