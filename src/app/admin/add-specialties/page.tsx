import { DataTable } from "@/components/data-table"
import { columns, SpecialtyRow } from "./columns"
import { AddSpecialtiesContent } from "./content"

const mockSpecialties: SpecialtyRow[] = [
  {
    id: "1",
    name: "Cardiology",
    description: "Heart and cardiovascular system specialists",
    doctorCount: 8,
    status: "Active",
  },
  {
    id: "2",
    name: "Neurology",
    description: "Brain and nervous system specialists",
    doctorCount: 6,
    status: "Active",
  },
  {
    id: "3",
    name: "Orthopedics",
    description: "Bone and joint specialists",
    doctorCount: 12,
    status: "Active",
  },
  {
    id: "4",
    name: "Pediatrics",
    description: "Children's health specialists",
    doctorCount: 10,
    status: "Active",
  },
  {
    id: "5",
    name: "Dermatology",
    description: "Skin health specialists",
    doctorCount: 5,
    status: "Active",
  },
  {
    id: "6",
    name: "Surgery",
    description: "Surgical specialists",
    doctorCount: 15,
    status: "Active",
  },
]

export default function Page() {
  return <AddSpecialtiesContent rows={mockSpecialties} />
}
