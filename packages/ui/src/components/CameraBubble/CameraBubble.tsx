import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import {
  CameraOff01Icon,
  DragDropIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface CameraBubbleProps {
  shape?: 'circle' | 'rounded';
  size?: number; // width in pixels (e.g. 128, 160, 224)
  isOff?: boolean;
  mirrored?: boolean;
  videoStream?: MediaStream | null;
  position?: { x: number; y: number }; // normalized 0..1 or pixel relative
  onPositionChange?: (pos: { x: number; y: number }) => void;
  boundsRef?: React.RefObject<HTMLElement>;
  className?: string;
  isDraggable?: boolean;
}

/**
 * Camera Bubble matches Figma Component 10:177 (Studio Components)
 * Variants: Shape=Circle, Shape=Rounded
 * States: Default (border/strong), Hover (lime ring + brand glow + top drag handle), Off (dashed border + camera off icon)
 */
export const CameraBubble: React.FC<CameraBubbleProps> = ({
  shape = 'circle',
  size = 140,
  isOff = false,
  mirrored = false,
  videoStream = null,
  position = { x: 0.82, y: 0.75 },
  onPositionChange,
  boundsRef,
  className,
  isDraggable = true,
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Attach MediaStream to internal video element
  useEffect(() => {
    if (videoRef.current) {
      if (videoStream && !isOff) {
        videoRef.current.srcObject = videoStream;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [videoStream, isOff]);

  const isCircle = shape === 'circle';
  const widthPx = size;
  const heightPx = isCircle ? size : Math.round(size * 0.625);

  // Drag handling within bounds
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable || isOff) return;
    e.preventDefault();
    setIsDragging(true);

    const bounds = boundsRef?.current?.getBoundingClientRect();
    const currentNormX = position.x;
    const currentNormY = position.y;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: bounds ? currentNormX * bounds.width : 0,
      startY: bounds ? currentNormY * bounds.height : 0,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!boundsRef?.current) return;
      const rect = boundsRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;
      const deltaY = moveEvent.clientY - dragStartRef.current.mouseY;

      const newPxX = dragStartRef.current.startX + deltaX;
      const newPxY = dragStartRef.current.startY + deltaY;

      // Constrain within bounds (with half-size padding)
      const clampedX = Math.max(widthPx / 2, Math.min(rect.width - widthPx / 2, newPxX));
      const clampedY = Math.max(heightPx / 2, Math.min(rect.height - heightPx / 2, newPxY));

      const normX = clampedX / rect.width;
      const normY = clampedY / rect.height;

      onPositionChange?.({ x: normX, y: normY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={bubbleRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
      }}
      className={cn(
        'absolute z-20 flex flex-col items-center justify-center overflow-hidden transition-all duration-150 select-none cursor-move',
        isCircle ? 'rounded-full' : 'rounded-2xl',
        isOff
          ? 'bg-[var(--color-bg-surface)] border-2 border-dashed border-[var(--color-border-strong)]'
          : [
              'bg-[var(--color-bg-elevated)]',
              isHovered || isDragging
                ? 'border-[3px] border-[var(--color-brand-default)] shadow-[var(--glow-brand)]'
                : 'border-2 border-[var(--color-border-strong)] shadow-lg',
            ],
        className
      )}
    >
      {/* Off state display */}
      {isOff ? (
        <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center pointer-events-none">
          <HugeIcon
            icon={CameraOff01Icon}
            size={Math.min(36, Math.round(widthPx * 0.28))}
            className="text-[var(--color-text-tertiary)]"
          />
          <span className="text-[11px] font-normal text-[var(--color-text-tertiary)] leading-tight">
            Camera off
          </span>
        </div>
      ) : (
        <>
          {/* Live Video Feed or Placeholder */}
          {videoStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'w-full h-full object-cover pointer-events-none',
                mirrored && 'scale-x-[-1]'
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-elevated)] pointer-events-none">
              <HugeIcon
                icon={UserCircleIcon}
                size={Math.min(56, Math.round(widthPx * 0.4))}
                className="text-[var(--color-text-tertiary)]"
              />
            </div>
          )}

          {/* Hover Drag Handle (Figma 10:157 & 10:173) */}
          {(isHovered || isDragging) && isDraggable && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 w-11 h-6 rounded-full bg-[var(--color-bg-active)] border border-[var(--color-border-strong)] flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing pointer-events-none"
              title="Drag to reposition"
            >
              <HugeIcon icon={DragDropIcon} size={14} className="text-[var(--color-text-primary)]" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

