import { useEffect, useRef, useState } from 'react';
import { createWheel } from '../utils/wheel/createWheel';
import { wheelConfig } from '../utils/wheel/config';
import { startSpinAdvanced, initSpinGenerator } from '../logic/spinLogic';
import { createSpinGenerator } from '../logic/random'; // если нужно

export const Wheel = () => {
  const svgRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastSpinResult, setLastSpinResult] = useState(null);
  const cancelSpinRef = useRef(null);
  const spinGeneratorRef = useRef(null);

  // Инициализация колеса и генератора
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Создаем колесо
    createWheel(svgRef);
    
    // Инициализируем генератор результатов
    spinGeneratorRef.current = createSpinGenerator({
      slots: wheelConfig.slots,
      prizes: wheelConfig.prizes,
      weights: wheelConfig.prizeWeights || null, // Опциональные веса призов
      fairMode: wheelConfig.fairMode !== false // По умолчанию честный режим
    });
    
    // Также инициализируем глобальный генератор
    initSpinGenerator({
      slots: wheelConfig.slots,
      prizes: wheelConfig.prizes
    });
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Отменяем предыдущую анимацию если есть
    if (cancelSpinRef.current) {
      cancelSpinRef.current.cancel();
    }

    // Запускаем спин с генератором
    const spinInstance = startSpinAdvanced({
      currentRotation: rotation,
      slots: wheelConfig.slots,
      prizes: wheelConfig.prizes,
      generator: spinGeneratorRef.current, // Используем сохраненный генератор
      generateOptions: {
        antiRepeat: true,      // Защита от повторений
        maxRepeats: 3,        // Не более 3 одинаковых призов подряд
        // guaranteed: 5,      // Для тестирования конкретного слота
      },
      onGenerate: (result) => {
        // Callback после генерации результата (до начала анимации)
        console.log('🎲 Сгенерирован результат:', {
          слот: result.targetSlot,
          приз: `${result.prize?.emoji} ${result.prize?.value}`,
          обороты: result.rotations.toFixed(1),
          id: result.id
        });
        
        // Можно сохранить результат для дальнейшего использования
        setLastSpinResult(result);
      },
      onUpdate: (newRotation) => {
        setRotation(newRotation);
      },
      onComplete: (finalRotation, winningIndex, prize) => {
        console.log('🎯 Выпал слот:', winningIndex);
        console.log('🏆 Приз:', prize);
        console.log('📊 Статистика:', spinGeneratorRef.current.getStatistics());
        
        setIsSpinning(false);
        setRotation(finalRotation);
        
        // Можно добавить дополнительные действия после выигрыша
        if (prize.value >= 500) {
          // Большой выигрыш!
          console.log('🎉 БОЛЬШОЙ ВЫИГРЫШ!');
        }
      }
    });

    // Сохраняем ссылку на текущий спин
    cancelSpinRef.current = spinInstance;
  };

  return (
    <div className="wheel-container">
      <div className="roulette-container">
        <svg
          ref={svgRef}
          viewBox="0 0 800 800"
          style={{ 
            width: '100%', 
            height: '100%',
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
            transition: 'none',
            overflow: 'visible'
          }}
        >
          <defs>
            <filter id="slot-glow" x="-200%" y="-200%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
            </filter>
          </defs>
          <circle cx="400" cy="400" r="400" fill="none" stroke="none" />
        </svg>
      </div>

      <div className="pointer"></div>

      <div className="bottom-panel">
        <button
          className="spin-button"
          onClick={handleSpin}
          disabled={isSpinning}
        >
          {isSpinning ? 'КРУТИТСЯ...' : 'КРУТИТЬ'}
        </button>
      </div>
    </div>
  );
};