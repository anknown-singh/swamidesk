'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Dental tooth conditions
export enum ToothCondition {
  HEALTHY = 'healthy',
  CARIES = 'caries',
  FILLED = 'filled',
  ROOT_CANAL = 'root_canal',
  CROWN = 'crown',
  EXTRACTED = 'extracted',
  IMPLANT = 'implant',
  BRIDGE = 'bridge',
  SENSITIVE = 'sensitive',
  FRACTURED = 'fractured'
}

// Tooth data interface
export interface ToothData {
  number: number
  quadrant: number
  position: number
  condition: ToothCondition
  notes?: string
  procedures?: string[]
}

// Dental chart props
export interface DentalChartProps {
  initialToothData?: ToothData[]
  onToothClick?: (tooth: ToothData) => void
  onToothUpdate?: (tooth: ToothData) => void
  readOnly?: boolean
  showNumbers?: boolean
  numberingSystem?: 'universal' | 'fdi'
}

// Condition styling
const conditionStyles: Record<ToothCondition, { bg: string; border: string; text: string }> = {
  [ToothCondition.HEALTHY]: { bg: 'bg-white', border: 'border-gray-300', text: 'text-gray-700' },
  [ToothCondition.CARIES]: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800' },
  [ToothCondition.FILLED]: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  [ToothCondition.ROOT_CANAL]: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800' },
  [ToothCondition.CROWN]: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  [ToothCondition.EXTRACTED]: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-500' },
  [ToothCondition.IMPLANT]: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800' },
  [ToothCondition.BRIDGE]: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
  [ToothCondition.SENSITIVE]: { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800' },
  [ToothCondition.FRACTURED]: { bg: 'bg-red-200', border: 'border-red-500', text: 'text-red-900' }
}

// Get tooth number based on numbering system
const getToothNumber = (quadrant: number, position: number, system: 'universal' | 'fdi'): string => {
  if (system === 'fdi') {
    return `${quadrant}${position}`
  }

  // Universal numbering system (1-32) - CORRECT mapping
  // In universal system: 1-16 are upper teeth (right to left), 17-32 are lower teeth (left to right)
  // FDI Quadrant 1 (Upper Right): 1-8 = Universal 1-8 (right to left)
  // FDI Quadrant 2 (Upper Left): 1-8 = Universal 9-16 (left to right)
  // FDI Quadrant 3 (Lower Left): 1-8 = Universal 17-24 (left to right)
  // FDI Quadrant 4 (Lower Right): 1-8 = Universal 25-32 (right to left)

  let universalNumber: number

  if (quadrant === 1) {
    // Upper Right: FDI 11,12,13,14,15,16,17,18 = Universal 8,7,6,5,4,3,2,1
    universalNumber = 9 - position
  } else if (quadrant === 2) {
    // Upper Left: FDI 21,22,23,24,25,26,27,28 = Universal 9,10,11,12,13,14,15,16
    universalNumber = 8 + position
  } else if (quadrant === 3) {
    // Lower Left: FDI 31,32,33,34,35,36,37,38 = Universal 24,23,22,21,20,19,18,17
    universalNumber = 25 - position
  } else if (quadrant === 4) {
    // Lower Right: FDI 41,42,43,44,45,46,47,48 = Universal 25,26,27,28,29,30,31,32
    universalNumber = 24 + position
  } else {
    return `${quadrant}${position}`
  }

  return universalNumber.toString()
}

// Individual tooth component
interface ToothProps {
  tooth: ToothData
  onClick?: (tooth: ToothData) => void
  readOnly?: boolean
  showNumber?: boolean
  numberingSystem?: 'universal' | 'fdi'
}

const Tooth: React.FC<ToothProps> = ({
  tooth,
  onClick,
  readOnly = false,
  showNumber = true,
  numberingSystem = 'universal'
}) => {
  const style = conditionStyles[tooth.condition]
  const displayNumber = getToothNumber(tooth.quadrant, tooth.position, numberingSystem)

  const handleClick = useCallback(() => {
    if (!readOnly && onClick) {
      // Create tooth object with correct display number
      const toothWithDisplayNumber = {
        ...tooth,
        number: parseInt(displayNumber) || tooth.number || parseInt(`${tooth.quadrant}${tooth.position}`)
      }
      onClick(toothWithDisplayNumber)
    }
  }, [tooth, onClick, readOnly, displayNumber])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center">
            <div
              className={`
                w-12 h-12 rounded-md flex items-center justify-center border-2 transition-all duration-200
                ${style.bg} ${style.border} ${style.text}
                ${!readOnly ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'}
                ${tooth.condition === ToothCondition.EXTRACTED ? 'opacity-50 relative' : ''}
              `}
              onClick={handleClick}
            >
              {tooth.condition === ToothCondition.EXTRACTED ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute"></div>
                  <div className="w-6 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                </div>
              ) : (
                showNumber && (
                  <span className={`text-xs font-medium ${style.text}`}>
                    {displayNumber}
                  </span>
                )
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Tooth {displayNumber}</p>
            <p className="text-sm capitalize">{tooth.condition.replace('_', ' ')}</p>
            {tooth.notes && <p className="text-xs text-muted-foreground">{tooth.notes}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Quadrant component
interface QuadrantProps {
  quadrantNumber: number
  teeth: ToothData[]
  onToothClick?: (tooth: ToothData) => void
  readOnly?: boolean
  showNumbers?: boolean
  numberingSystem?: 'universal' | 'fdi'
  className?: string
}

const Quadrant: React.FC<QuadrantProps> = ({
  quadrantNumber,
  teeth,
  onToothClick,
  readOnly,
  showNumbers,
  numberingSystem,
  className = ''
}) => {
  const quadrantTeeth = teeth.filter(t => t.quadrant === quadrantNumber)
  const positions = Array.from({ length: 8 }, (_, i) => i + 1)

  return (
    <div className={`flex gap-2 p-3 ${className}`}>
      {positions.map((position) => {
        const existingTooth = quadrantTeeth.find(t => t.position === position)

        const tooth = existingTooth || {
          number: parseInt(`${quadrantNumber}${position}`), // FDI number as fallback
          quadrant: quadrantNumber,
          position,
          condition: ToothCondition.HEALTHY
        }

        return (
          <Tooth
            key={`${quadrantNumber}-${position}`}
            tooth={tooth}
            onClick={onToothClick}
            readOnly={readOnly}
            showNumber={showNumbers}
            numberingSystem={numberingSystem}
          />
        )
      })}
    </div>
  )
}

// Main dental chart component
export const DentalChart: React.FC<DentalChartProps> = ({
  initialToothData = [],
  onToothClick,
  readOnly = false,
  showNumbers = true,
  numberingSystem = 'universal'
}) => {
  const [teethData, setTeethData] = useState<ToothData[]>(initialToothData)

  // Sync internal state with prop changes
  useEffect(() => {
    console.log('🦷 DentalChart: Syncing tooth data', {
      newData: initialToothData,
      hasChanged: JSON.stringify(initialToothData) !== JSON.stringify(teethData)
    })
    setTeethData(initialToothData)
  }, [initialToothData]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToothClick = useCallback((tooth: ToothData) => {
    console.log('🦷 DentalChart: Tooth clicked', {
      tooth,
      quadrant: tooth.quadrant,
      position: tooth.position,
      number: tooth.number
    })
    if (onToothClick) {
      onToothClick(tooth)
    }
  }, [onToothClick])

  // Legend for tooth conditions
  const conditionLegend = Object.entries(conditionStyles).filter(([condition]) =>
    condition !== ToothCondition.HEALTHY
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Dental Chart</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {numberingSystem.toUpperCase()} System
            </Badge>
            {!readOnly && (
              <Badge variant="secondary" className="text-xs">
                Click teeth to edit
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Dental Chart Layout */}
          <div className="relative">
            {/* Upper quadrants */}
            <div className="flex justify-center items-center mb-4">
              {/* Quadrant 2 (Upper Left) */}
              <div className="flex-1 flex justify-end">
                <Quadrant
                  quadrantNumber={2}
                  teeth={teethData}
                  onToothClick={handleToothClick}
                  readOnly={readOnly}
                  showNumbers={showNumbers}
                  numberingSystem={numberingSystem}
                  className="flex-row-reverse"
                />
              </div>

              {/* Center divider */}
              <div className="mx-4">
                <div className="w-px h-16 bg-gray-300"></div>
              </div>

              {/* Quadrant 1 (Upper Right) */}
              <div className="flex-1 flex justify-start">
                <Quadrant
                  quadrantNumber={1}
                  teeth={teethData}
                  onToothClick={handleToothClick}
                  readOnly={readOnly}
                  showNumbers={showNumbers}
                  numberingSystem={numberingSystem}
                />
              </div>
            </div>

            {/* Horizontal divider */}
            <div className="flex justify-center mb-4">
              <div className="h-px w-full max-w-2xl bg-gray-300"></div>
            </div>

            {/* Lower quadrants */}
            <div className="flex justify-center items-center">
              {/* Quadrant 3 (Lower Left) */}
              <div className="flex-1 flex justify-end">
                <Quadrant
                  quadrantNumber={3}
                  teeth={teethData}
                  onToothClick={handleToothClick}
                  readOnly={readOnly}
                  showNumbers={showNumbers}
                  numberingSystem={numberingSystem}
                  className="flex-row-reverse"
                />
              </div>

              {/* Center divider */}
              <div className="mx-4">
                <div className="w-px h-16 bg-gray-300"></div>
              </div>

              {/* Quadrant 4 (Lower Right) */}
              <div className="flex-1 flex justify-start">
                <Quadrant
                  quadrantNumber={4}
                  teeth={teethData}
                  onToothClick={handleToothClick}
                  readOnly={readOnly}
                  showNumbers={showNumbers}
                  numberingSystem={numberingSystem}
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-3">Condition Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {conditionLegend.map(([condition, style]) => (
                <div key={condition} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border ${style.bg} ${style.border}`}></div>
                  <span className="text-xs capitalize">{condition.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}