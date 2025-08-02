export function createSectorWithStraightGaps(
  cx, cy, innerR, outerR,
  slotIndex, totalSlots, gapWidth,
  cornerRadius, adjustFactor = 0.1
) {
  const angleStep = (2 * Math.PI) / totalSlots;
  const centerAngle = slotIndex * angleStep - Math.PI / 2;

  const dirX = Math.cos(centerAngle);
  const dirY = Math.sin(centerAngle);
  const perpX = -dirY;
  const perpY = dirX;

  const outerCircumference = 2 * Math.PI * outerR;
  const sectorWidthOuter = (outerCircumference / totalSlots) - gapWidth;
  const halfWidthOuter = sectorWidthOuter / 2;

  const innerCircumference = 2 * Math.PI * innerR;
  const sectorWidthInner = (innerCircumference / totalSlots) - gapWidth;
  const halfWidthInner = sectorWidthInner / 2;

  const outerLeft = {
    x: cx + outerR * dirX - halfWidthOuter * perpX,
    y: cy + outerR * dirY - halfWidthOuter * perpY
  };
  const outerRight = {
    x: cx + outerR * dirX + halfWidthOuter * perpX,
    y: cy + outerR * dirY + halfWidthOuter * perpY
  };
  const innerLeft = {
    x: cx + innerR * dirX - halfWidthInner * perpX,
    y: cy + innerR * dirY - halfWidthInner * perpY
  };
  const innerRight = {
    x: cx + innerR * dirX + halfWidthInner * perpX,
    y: cy + innerR * dirY + halfWidthInner * perpY
  };

  const maxRadius = Math.min(
    cornerRadius,
    (outerR - innerR) * 0.9,
    halfWidthInner * 0.5
  );

  const outerLeftAngle = Math.atan2(outerLeft.y - cy, outerLeft.x - cx);
  const outerRightAngle = Math.atan2(outerRight.y - cy, outerRight.x - cx);
  const outerAngleAdjust = maxRadius / outerR;

  const outerLeftStart = {
    x: cx + outerR * Math.cos(outerLeftAngle + outerAngleAdjust),
    y: cy + outerR * Math.sin(outerLeftAngle + outerAngleAdjust)
  };
  const outerRightEnd = {
    x: cx + outerR * Math.cos(outerRightAngle - outerAngleAdjust),
    y: cy + outerR * Math.sin(outerRightAngle - outerAngleAdjust)
  };

  const innerLeftAngle = Math.atan2(innerLeft.y - cy, innerLeft.x - cx);
  const innerRightAngle = Math.atan2(innerRight.y - cy, innerRight.x - cx);
  const innerAngleAdjust = maxRadius / innerR;

  const innerLeftEnd = {
    x: cx + innerR * Math.cos(innerLeftAngle + innerAngleAdjust),
    y: cy + innerR * Math.sin(innerLeftAngle + innerAngleAdjust)
  };
  const innerRightStart = {
    x: cx + innerR * Math.cos(innerRightAngle - innerAngleAdjust),
    y: cy + innerR * Math.sin(innerRightAngle - innerAngleAdjust)
  };

  const rightOuterCorner = {
    x: outerRight.x + adjustFactor * (innerRight.x - outerRight.x),
    y: outerRight.y + adjustFactor * (innerRight.y - outerRight.y)
  };
  const rightInnerCorner = {
    x: innerRight.x - adjustFactor * (innerRight.x - outerRight.x),
    y: innerRight.y - adjustFactor * (innerRight.y - outerRight.y)
  };
  const leftOuterCorner = {
    x: outerLeft.x + adjustFactor * (innerLeft.x - outerLeft.x),
    y: outerLeft.y + adjustFactor * (innerLeft.y - outerLeft.y)
  };
  const leftInnerCorner = {
    x: innerLeft.x - adjustFactor * (innerLeft.x - outerLeft.x),
    y: innerLeft.y - adjustFactor * (innerLeft.y - outerLeft.y)
  };

  let outerSweep = outerRightAngle - outerLeftAngle;
  if (outerSweep < 0) outerSweep += 2 * Math.PI;
  if (outerSweep > Math.PI) outerSweep -= 2 * Math.PI;

  const largeArcOuter = Math.abs(outerSweep) > Math.PI ? 1 : 0;
  const smoothFactor = 0.2;
  
  return `
    M ${outerLeftStart.x} ${outerLeftStart.y}
    A ${outerR} ${outerR} 0 ${largeArcOuter} 1 ${outerRightEnd.x} ${outerRightEnd.y}

    A ${maxRadius} ${maxRadius} 0 0 1 ${rightOuterCorner.x} ${rightOuterCorner.y}
    L ${rightInnerCorner.x} ${rightInnerCorner.y}
    Q ${innerRight.x} ${innerRight.y} ${innerRightStart.x} ${innerRightStart.y}

    A ${innerR} ${innerR} 0 ${largeArcOuter} 0 ${innerLeftEnd.x} ${innerLeftEnd.y}

    Q ${innerLeft.x} ${innerLeft.y} ${leftInnerCorner.x} ${leftInnerCorner.y}
    L ${leftOuterCorner.x} ${leftOuterCorner.y}
    A ${maxRadius} ${maxRadius} 0 0 1 ${outerLeftStart.x} ${outerLeftStart.y}
    Z
  `;
}