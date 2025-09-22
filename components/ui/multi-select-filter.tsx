"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ChevronDown, X, Search } from "lucide-react"

interface MultiSelectFilterProps {
  label?: string
  placeholder: string
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  maxDisplayItems?: number
}

interface CityMultiSelectFilterProps {
  label?: string
  placeholder: string
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  optionIdToName?: Record<string, string>
}

export function MultiSelectFilter({
  label,
  placeholder,
  options,
  selectedValues,
  onSelectionChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchValue.toLowerCase()))

  function handleSelect(value: string) {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value]

    onSelectionChange(newSelection)
  }

  function handleRemove(value: string) {
    onSelectionChange(selectedValues.filter((item) => item !== value))
  }

  function handleClearAll() {
    onSelectionChange([])
  }

  const getButtonText = () => {
    if (selectedValues.length === 0) {
      return placeholder
    }
    if (selectedValues.length === 1) {
      return "1 selecionado"
    }
    return `${selectedValues.length} selecionados`
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 py-2 bg-transparent"
          >
            <span className="text-left truncate">
              {selectedValues.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span>{getButtonText()}</span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder={`Buscar ${label?.toLowerCase() || "item"}...`}
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <CommandList className="max-h-[200px]">
              {selectedValues.length > 0 && (
                <div className="p-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    Limpar seleção ({selectedValues.length})
                  </Button>
                </div>
              )}

              <CommandEmpty>
                {searchValue ? `Nenhum resultado para "${searchValue}"` : `Nenhum ${label?.toLowerCase() || "item"} encontrado`}
              </CommandEmpty>

              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedValues.includes(option)}
                      onChange={() => handleSelect(option)}
                      className="pointer-events-none"
                    />
                    <span className="flex-1">{option}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((value) => (
            <Badge key={value} variant="secondary" className="text-xs">
              {value}
              <button
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                onClick={() => handleRemove(value)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function CityMultiSelectFilter({
  label,
  placeholder,
  options,
  selectedValues,
  onSelectionChange,
  optionIdToName = {},
}: CityMultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredOptions = options.filter((cityId) => {
    const cityName = optionIdToName[cityId] || cityId
    return cityName.toLowerCase().includes(searchValue.toLowerCase())
  })

  function handleSelect(value: string) {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value]

    onSelectionChange(newSelection)
  }

  function handleRemove(value: string) {
    onSelectionChange(selectedValues.filter((item) => item !== value))
  }

  function handleClearAll() {
    onSelectionChange([])
  }

  const getButtonText = () => {
    if (selectedValues.length === 0) {
      return placeholder
    }
    if (selectedValues.length === 1) {
      const cityName = optionIdToName[selectedValues[0]] || selectedValues[0]
      return cityName
    }
    return `${selectedValues.length} selecionados`
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 py-2 bg-transparent"
          >
            <span className="text-left truncate">
              {selectedValues.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span>{getButtonText()}</span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder={`Buscar ${label?.toLowerCase() || "cidade"}...`}
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <CommandList className="max-h-[200px]">
              {selectedValues.length > 0 && (
                <div className="p-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    Limpar seleção ({selectedValues.length})
                  </Button>
                </div>
              )}

              <CommandEmpty>
                {searchValue ? `Nenhum resultado para "${searchValue}"` : `Nenhuma ${label?.toLowerCase() || "cidade"} encontrada`}
              </CommandEmpty>

              <CommandGroup>
                {filteredOptions.map((cityId) => {
                  const cityName = optionIdToName[cityId] || cityId
                  return (
                    <CommandItem
                      key={cityId}
                      value={cityName}
                      onSelect={() => handleSelect(cityId)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedValues.includes(cityId)}
                        onChange={() => handleSelect(cityId)}
                        className="pointer-events-none"
                      />
                      <span className="flex-1">{cityName}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((cityId) => {
            const cityName = optionIdToName[cityId] || cityId
            return (
              <Badge key={cityId} variant="secondary" className="text-xs">
                {cityName}
                <button
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  onClick={() => handleRemove(cityId)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
