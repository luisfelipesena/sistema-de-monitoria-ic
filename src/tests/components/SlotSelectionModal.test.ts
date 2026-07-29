import {
    formatSlotLabel,
    slotToValue,
    valueToSlot,
} from "@/components/features/projeto/SlotSelectionModal"
import type { SlotDataHorario } from "@/types/selecao-inputs"
import { describe, expect, it } from "vitest"

describe("SlotSelectionModal - Helper functions", () => {
  const sampleSlots: SlotDataHorario[] = [
    { data: "2025-03-15", horario: "14:00-16:00" },
    { data: "2025-03-17", horario: "09:00-11:00" },
    { data: "2025-04-01", horario: "10:00-12:00" },
  ]

  describe("slotToValue", () => {
    it("should serialize slot to pipe-separated string", () => {
      expect(slotToValue(sampleSlots[0])).toBe("2025-03-15|14:00-16:00")
      expect(slotToValue(sampleSlots[1])).toBe("2025-03-17|09:00-11:00")
    })

    it("should produce unique values for different slots", () => {
      const values = sampleSlots.map(slotToValue)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(sampleSlots.length)
    })
  })

  describe("valueToSlot", () => {
    it("should find the matching slot from a value string", () => {
      const value = "2025-03-15|14:00-16:00"
      const result = valueToSlot(value, sampleSlots)
      expect(result).toEqual({ data: "2025-03-15", horario: "14:00-16:00" })
    })

    it("should return undefined when value does not match any slot", () => {
      const result = valueToSlot("2025-12-31|08:00-10:00", sampleSlots)
      expect(result).toBeUndefined()
    })

    it("should return undefined for empty value string", () => {
      const result = valueToSlot("", sampleSlots)
      expect(result).toBeUndefined()
    })
  })

  describe("formatSlotLabel", () => {
    it("should format a slot with date in pt-BR and include the time range", () => {
      const slot: SlotDataHorario = { data: "2025-03-15", horario: "14:00-16:00" }
      const label = formatSlotLabel(slot)

      // Should contain the time range
      expect(label).toContain("14:00-16:00")
      // Should contain the separator
      expect(label).toContain("—")
      // Should contain day "15"
      expect(label).toContain("15")
      // Should contain year
      expect(label).toContain("2025")
    })

    it("should format different slots distinctly", () => {
      const label1 = formatSlotLabel(sampleSlots[0])
      const label2 = formatSlotLabel(sampleSlots[1])
      expect(label1).not.toBe(label2)
    })
  })
})
