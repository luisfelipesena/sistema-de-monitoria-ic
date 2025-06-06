import * as React from "react"
import { ArrowRightIcon, CalendarIcon, ClockIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DateTimeRangeData = {
  fromDate?: Date
  fromTime?: string
  toDate?: Date
  toTime?: string
}

interface DateTimeRangeSelectorProps {
  value?: DateTimeRangeData
  onChange?: (value: DateTimeRangeData) => void
  includeTime?: boolean
  className?: string
  showSearchButton?: boolean
  onSearch?: (value: DateTimeRangeData) => void
}

function DateTimeRangeSelector({
  value,
  onChange,
  includeTime = true,
  className,
  showSearchButton = true,
  onSearch
}: DateTimeRangeSelectorProps) {
  const [dateTimeRange, setDateTimeRange] = React.useState<DateTimeRangeData>(
    value || {}
  )
  const [openFromDate, setOpenFromDate] = React.useState(false)
  const [openFromTime, setOpenFromTime] = React.useState(false)
  const [openToDate, setOpenToDate] = React.useState(false)
  const [openToTime, setOpenToTime] = React.useState(false)

  // Sync with external value
  React.useEffect(() => {
    if (value) {
      setDateTimeRange(value)
    }
  }, [value])

  const updateDateTimeRange = (newValue: DateTimeRangeData) => {
    setDateTimeRange(newValue)
    onChange?.(newValue)
  }

  const handleSequentialPopover = (currentStep: string, selectedValue: any) => {
    let newValue: DateTimeRangeData

    switch (currentStep) {
      case "fromDate":
        newValue = {
          ...dateTimeRange,
          fromDate: selectedValue,
          toDate: undefined,
          toTime: "",
        }
        updateDateTimeRange(newValue)
        setOpenFromDate(false)
        if (includeTime) {
          setOpenFromTime(true)
        } else {
          setOpenToDate(true)
        }
        break
      case "fromTime":
        newValue = {
          ...dateTimeRange,
          fromTime: selectedValue,
          toDate: undefined,
          toTime: "",
        }
        updateDateTimeRange(newValue)
        setOpenFromTime(false)
        setOpenToDate(true)
        break
      case "toDate":
        newValue = { ...dateTimeRange, toDate: selectedValue }
        updateDateTimeRange(newValue)
        setOpenToDate(false)
        if (includeTime) {
          setOpenToTime(true)
        }
        break
      case "toTime":
        newValue = { ...dateTimeRange, toTime: selectedValue }
        updateDateTimeRange(newValue)
        setOpenToTime(false)
        break
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Select date"
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const generateTimeSlots = (isToTimeSlot: boolean = false) => {
    const slots = []
    for (let hour = 8; hour <= 21; hour++) {
      const isPM = hour >= 12
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const meridiem = isPM ? "PM" : "AM"

      slots.push({
        value: `${hour.toString().padStart(2, "0")}:00`,
        label: `${displayHour}:00 ${meridiem}`,
      })

      if (isToTimeSlot || hour !== 21) {
        slots.push({
          value: `${hour.toString().padStart(2, "0")}:30`,
          label: `${displayHour}:30 ${meridiem}`,
        })
      }
    }

    if (isToTimeSlot && dateTimeRange.fromDate && dateTimeRange.toDate && includeTime) {
      const isSameDay =
        dateTimeRange.fromDate.toDateString() ===
        dateTimeRange.toDate.toDateString()

      if (isSameDay && dateTimeRange.fromTime) {
        return slots.filter((slot) => slot.value > dateTimeRange.fromTime!)
      }
    }
    return slots
  }

  const validateFilters = (): { isValid: boolean; message: string } => {
    if (!dateTimeRange.fromDate) {
      return { isValid: false, message: "Please select 'From' date" }
    }
    if (includeTime && !dateTimeRange.fromTime) {
      return { isValid: false, message: "Please select 'From' time" }
    }
    if (!dateTimeRange.toDate) {
      return { isValid: false, message: "Please select 'To' date" }
    }
    if (includeTime && !dateTimeRange.toTime) {
      return { isValid: false, message: "Please select 'To' time" }
    }
    return { isValid: true, message: "" }
  }

  const handleSearch = () => {
    const { isValid, message } = validateFilters()

    if (!isValid) {
      toast("Incomplete selection", {
        description: message,
      })
      return
    }

    onSearch?.(dateTimeRange)
  }

  return (
    <div className={cn("min-w-sm space-y-4", className)}>
      {/* From Section */}
      <div>
        <p className="text-foreground mb-2 text-sm font-medium">Início</p>
        <div className="flex">
          <Popover open={openFromDate} onOpenChange={setOpenFromDate}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 flex-1 justify-start gap-0 font-normal",
                  includeTime ? "rounded-r-none border-r-0" : "rounded-r-md",
                  !dateTimeRange.fromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(dateTimeRange.fromDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                fromYear={new Date().getFullYear() - 10}
                toYear={new Date().getFullYear() + 1}
                selected={dateTimeRange.fromDate}
                onSelect={(date) => handleSequentialPopover("fromDate", date)}
                disabled={(date) => date < today}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {includeTime && (
            <Popover open={openFromTime} onOpenChange={setOpenFromTime}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 flex-1 justify-start gap-0 rounded-l-none",
                    !dateTimeRange.fromTime && "text-muted-foreground"
                  )}
                >
                  <ClockIcon className="mr-2 h-4 w-4" />
                  {dateTimeRange.fromTime
                    ? generateTimeSlots().find(
                        (slot) => slot.value === dateTimeRange.fromTime
                      )?.label
                    : "Select time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                asChild
                className="w-[var(--radix-popover-trigger-width)] p-0"
              >
                <Command>
                  <CommandList>
                    <CommandEmpty>No time slots available.</CommandEmpty>
                    <CommandGroup>
                      {generateTimeSlots().map((slot) => (
                        <CommandItem
                          key={`from-${slot.value}`}
                          value={slot.value}
                          onSelect={(value) =>
                            handleSequentialPopover("fromTime", value)
                          }
                        >
                          {slot.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      
      {/* To Section */}
      <div>
        <p className="text-foreground mb-2 text-sm font-medium">Fim</p>
        <div className="flex">
          <Popover open={openToDate} onOpenChange={setOpenToDate}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 flex-1 justify-start gap-0 font-normal",
                  includeTime ? "rounded-r-none border-r-0" : "rounded-r-md",
                  !dateTimeRange.toDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDate(dateTimeRange.toDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                fromYear={new Date().getFullYear() - 10}
                toYear={new Date().getFullYear() + 1}
                selected={dateTimeRange.toDate}
                onSelect={(date) => handleSequentialPopover("toDate", date)}
                disabled={(date) => {
                  const fromDate = dateTimeRange.fromDate
                  if (!fromDate) return date < today
                  return date < fromDate || date < today
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {includeTime && (
            <Popover open={openToTime} onOpenChange={setOpenToTime}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 flex-1 justify-start gap-0 rounded-l-none",
                    !dateTimeRange.toTime && "text-muted-foreground"
                  )}
                >
                  <ClockIcon className="mr-2 h-4 w-4" />
                  {dateTimeRange.toTime
                    ? generateTimeSlots(true).find(
                        (slot) => slot.value === dateTimeRange.toTime
                      )?.label
                    : "Select time"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                asChild
                className="w-[var(--radix-popover-trigger-width)] p-0"
              >
                <Command>
                  <CommandList>
                    <CommandEmpty>No time slots available.</CommandEmpty>
                    <CommandGroup>
                      {generateTimeSlots(true).map((slot) => (
                        <CommandItem
                          key={`to-${slot.value}`}
                          value={slot.value}
                          onSelect={(value) =>
                            handleSequentialPopover("toTime", value)
                          }
                        >
                          {slot.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      
      {showSearchButton && (
        <Button className="mt-4 w-full" onClick={handleSearch}>
          Search
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default DateTimeRangeSelector
export type { DateTimeRangeData }
