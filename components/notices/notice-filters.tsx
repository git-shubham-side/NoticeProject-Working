"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { NOTICE_CATEGORIES, NOTICE_PRIORITIES, NOTICE_STATUSES } from "@/lib/constants"
import type { Institution, Department, Class } from "@/types"

interface NoticeFiltersProps {
  onFiltersChange: (filters: FilterValues) => void
  userRole?: string
  showInstitutionFilter?: boolean
}

export interface FilterValues {
  search: string
  category: string
  priority: string
  status: string
  institutionId: string
  departmentId: string
  classId: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

const initialFilters: FilterValues = {
  search: "",
  category: "",
  priority: "",
  status: "",
  institutionId: "",
  departmentId: "",
  classId: "",
  dateFrom: undefined,
  dateTo: undefined,
}

export function NoticeFilters({ 
  onFiltersChange, 
  userRole = "student",
  showInstitutionFilter = false 
}: NoticeFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (showInstitutionFilter) {
      fetch("/api/institutions").then(res => res.json()).then(data => setInstitutions(data.institutions || []))
    }
    fetch("/api/departments").then(res => res.json()).then(data => setDepartments(data.departments || []))
    fetch("/api/classes").then(res => res.json()).then(data => setClasses(data.classes || []))
  }, [showInstitutionFilter])

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof FilterValues, value: string | Date | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters(initialFilters)
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "search") return false
    return value !== "" && value !== undefined
  }).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notices..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {NOTICE_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(v) => updateFilter("priority", v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {NOTICE_PRIORITIES.map(pri => (
                <SelectItem key={pri.value} value={pri.value}>{pri.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(userRole === "super_admin" || userRole === "institution_admin") && (
              <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {NOTICE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showInstitutionFilter && (
              <Select value={filters.institutionId} onValueChange={(v) => updateFilter("institutionId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  {institutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filters.departmentId} onValueChange={(v) => updateFilter("departmentId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.classId} onValueChange={(v) => updateFilter("classId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
