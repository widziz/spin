import { wheelConfig } from './config';
import { createSectorWithStraightGaps } from './createSector';

export const createWheel = (svgRef) => {
  const svg = svgRef.current;
  if (!svg) return;

  // Clear existing content
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  const { centerX, centerY, outerRadius, innerRadius, slots, gapWidth, cornerRadius, prizes } = wheelConfig;

  // Create defs element
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  // Create donut frame
  const donutFrame = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const donutOuterRadius = outerRadius + 10;
  const donutInnerRadius = innerRadius - 10;
  
  const donutPath = `
    M ${centerX - donutOuterRadius}, ${centerY}
    a ${donutOuterRadius},${donutOuterRadius} 0 1,0 ${donutOuterRadius * 2},0
    a ${donutOuterRadius},${donutOuterRadius} 0 1,0 -${donutOuterRadius * 2},0
    M ${centerX - donutInnerRadius}, ${centerY}
    a ${donutInnerRadius},${donutInnerRadius} 0 1,0 ${donutInnerRadius * 2},0
    a ${donutInnerRadius},${donutInnerRadius} 0 1,0 -${donutInnerRadius * 2},0
    Z
  `;
  
  donutFrame.setAttribute('d', donutPath);
  donutFrame.setAttribute('fill', '#222222');
  donutFrame.setAttribute('fill-rule', 'evenodd');
  donutFrame.setAttribute('stroke', '#444');
  donutFrame.setAttribute('stroke-width', '2');
  svg.appendChild(donutFrame);

  // Create glow filter
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'slot-glow');
  filter.setAttribute('x', '-200%');
  filter.setAttribute('y', '-200%');
  filter.setAttribute('width', '400%');
  filter.setAttribute('height', '400%');

  const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '25');

  filter.appendChild(blur);
  defs.appendChild(filter);

  // Create slots
  for (let i = 0; i < slots; i++) {
    const slotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    slotGroup.classList.add('slot');
    slotGroup.setAttribute('data-slot', i.toString());

    const prize = prizes[i % prizes.length];
    let strokeColor = '#aaa';
    if (prize.value >= 'Буст') strokeColor = '#ff9033';
    else if (prize.value >= 150) strokeColor = '#f0d333ff';
    else if (prize.value >= 75) strokeColor = '#ff4a50';
    else if (prize.value >= 40) strokeColor = '#c32dffff';
    else if (prize.value >= 20) strokeColor = '#53bbf7ff';
    else if (prize.value >= 10) strokeColor = '#575757';

    const angleStep = (2 * Math.PI) / slots;
    const centerAngle = i * angleStep - Math.PI / 2;
    const slotHeight = outerRadius - innerRadius;
    const slotWidth = (2 * Math.PI * outerRadius / slots) - gapWidth;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', createSectorWithStraightGaps(
      centerX,
      centerY,
      innerRadius + 1.5,
      outerRadius - 1.5,
      i,
      slots,
      gapWidth,
      cornerRadius
    ));
    path.setAttribute('fill', '#222222');
    path.setAttribute('stroke', 'none');
    slotGroup.appendChild(path);

    // Create mask and gradient for glow
    const maskId = `slot-mask-${i}`;
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', maskId);

    const maskShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    maskShape.setAttribute('d', path.getAttribute('d'));
    maskShape.setAttribute('fill', 'white');
    mask.appendChild(maskShape);
    defs.appendChild(mask);

    const gradientId = `glow-gradient-${i}`;
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('cx', '50%');
    gradient.setAttribute('cy', '50%');
    gradient.setAttribute('r', '50%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', strokeColor);
    stop1.setAttribute('stop-opacity', '1');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '70%');
    stop2.setAttribute('stop-color', strokeColor);
    stop2.setAttribute('stop-opacity', '0.3');

    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', strokeColor);
    stop3.setAttribute('stop-opacity', '0');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);

    // Glow effect
    const maskedGlow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    maskedGlow.setAttribute('mask', `url(#${maskId})`);
    
    const glowDistance = innerRadius + slotHeight * 0.8;
    const glowCenterX = centerX + (glowDistance * Math.cos(centerAngle));
    const glowCenterY = centerY + (glowDistance * Math.sin(centerAngle));

    const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glowCircle.setAttribute('cx', glowCenterX);
    glowCircle.setAttribute('cy', glowCenterY);
    glowCircle.setAttribute('r', slotHeight * 0.6);
    glowCircle.setAttribute('fill', `url(#${gradientId})`);
    glowCircle.setAttribute('filter', 'url(#slot-glow)');
    glowCircle.setAttribute('opacity', '0.5');

    maskedGlow.appendChild(glowCircle);
    slotGroup.appendChild(maskedGlow);

    // Stroke overlay
    const strokeOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    strokeOverlay.setAttribute('d', path.getAttribute('d'));
    strokeOverlay.setAttribute('fill', 'none');
    strokeOverlay.setAttribute('stroke', strokeColor);
    strokeOverlay.setAttribute('stroke-width', '2');
    strokeOverlay.setAttribute('pointer-events', 'none');
    slotGroup.appendChild(strokeOverlay);

    // Bottom rectangle
    const rectWidth = slotWidth / 2;
    const rectHeight = slotHeight / 28;
    const centerDistance = innerRadius + slotHeight - rectHeight * 1.5;
    const offset = 5;
    const rectCenterX = centerX + (centerDistance * Math.cos(centerAngle)) + offset * Math.cos(centerAngle);
    const rectCenterY = centerY + (centerDistance * Math.sin(centerAngle)) + offset * Math.sin(centerAngle);

    const bottomRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bottomRect.setAttribute('x', rectCenterX - rectWidth / 2);
    bottomRect.setAttribute('y', rectCenterY - rectHeight / 2);
    bottomRect.setAttribute('width', rectWidth);
    bottomRect.setAttribute('height', rectHeight);
    bottomRect.setAttribute('rx', '4');
    bottomRect.setAttribute('ry', '4');
    bottomRect.setAttribute('fill', strokeColor);

    const angleDeg = (centerAngle * 180) / Math.PI + 90;
    bottomRect.setAttribute('transform', `rotate(${angleDeg} ${rectCenterX} ${rectCenterY})`);
    slotGroup.appendChild(bottomRect);

    // Image and text
    const textRadius = (outerRadius + innerRadius) / 2;
    const imageX = centerX + (textRadius + 22) * Math.cos(centerAngle);
    const imageY = centerY + (textRadius + 22) * Math.sin(centerAngle);
    const textX = centerX + (textRadius - 52) * Math.cos(centerAngle);
    const textY = centerY + (textRadius - 52) * Math.sin(centerAngle);
    const textRotationAngle = (centerAngle * 180 / Math.PI) + 90 + 180;

    // Image group
    const imageGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    imageGroup.setAttribute('transform', `rotate(${textRotationAngle} ${imageX} ${imageY})`);

    const imageSize = 95; 
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('x', imageX - imageSize/2); // Центрирование по X
    image.setAttribute('y', imageY - imageSize/2); // Центрирование по Y
    image.setAttribute('width', imageSize.toString());
    image.setAttribute('height', imageSize.toString());
    image.setAttribute('href', `/src/assets/svg/${prize.image}`);
    image.setAttribute('class', 'slot-image');
    imageGroup.appendChild(image);

    // Text group
    const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    textGroup.setAttribute('transform', `rotate(${textRotationAngle} ${textX} ${textY})`);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.classList.add('slot-text');
    text.setAttribute('x', textX);
    text.setAttribute('y', textY);
    text.textContent = prize.value;
    textGroup.appendChild(text);

    slotGroup.appendChild(imageGroup);
    slotGroup.appendChild(textGroup);

    slotGroup.addEventListener('click', () => {
      console.log(`Selected slot ${i}: ${prize.image} ${prize.value}`);
    });

    svg.appendChild(slotGroup);
  }
};