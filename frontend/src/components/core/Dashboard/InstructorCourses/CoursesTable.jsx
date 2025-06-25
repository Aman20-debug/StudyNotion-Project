import {
    useReactTable,
    getCoreRowModel,
    flexRender,
  } from "@tanstack/react-table"
  import { useNavigate } from "react-router-dom"
  import { useDispatch, useSelector } from "react-redux"
  import { useMemo, useState } from "react"
  import { FaCheck } from "react-icons/fa"
  import { FiEdit2 } from "react-icons/fi"
  import { HiClock } from "react-icons/hi"
  import { RiDeleteBin6Line } from "react-icons/ri"
  import { formatDate } from "../../../../services/formatDate"
  import { deleteCourse, fetchInstructorCourses } from "../../../../services/operations/courseDetailsAPI"
  import { COURSE_STATUS } from "../../../../utils/constants"
  import ConfirmationModal from "../../../common/ConfirmationModal"
  
  export default function CoursesTable({ courses, setCourses }) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { token } = useSelector((state) => state.auth)
    const [loading, setLoading] = useState(false)
    const [confirmationModal, setConfirmationModal] = useState(null)
    const TRUNCATE_LENGTH = 30
  
    const handleCourseDelete = async (courseId) => {
      setLoading(true)
      await deleteCourse({ courseId }, token)
      const result = await fetchInstructorCourses(token)
      if (result) {
        setCourses(result)
      }
      setConfirmationModal(null)
      setLoading(false)
    }
  
    const columns = useMemo(() => [
      {
        header: "Courses",
        accessorKey: "courseName",
        cell: ({ row }) => {
          const course = row.original
          return (
            <div className="flex gap-4">
              <img
                src={course.thumbnail}
                alt={course.courseName}
                className="h-[148px] w-[220px] rounded-lg object-cover"
              />
              <div className="flex flex-col justify-between">
                <p className="text-lg font-semibold text-richblack-5">{course.courseName}</p>
                <p className="text-xs text-richblack-300">
                  {course.courseDescription.split(" ").length > TRUNCATE_LENGTH
                    ? course.courseDescription.split(" ").slice(0, TRUNCATE_LENGTH).join(" ") + "..."
                    : course.courseDescription}
                </p>
                <p className="text-[12px] text-white">Created: {formatDate(course.createdAt)}</p>
                {course.status === COURSE_STATUS.DRAFT ? (
                  <p className="flex items-center gap-2 rounded-full bg-richblack-700 px-2 py-[2px] text-[12px] font-medium text-pink-100 w-fit">
                    <HiClock size={14} />
                    Drafted
                  </p>
                ) : (
                  <p className="flex items-center gap-2 rounded-full bg-richblack-700 px-2 py-[2px] text-[12px] font-medium text-yellow-100 w-fit">
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-100 text-richblack-700">
                      <FaCheck size={8} />
                    </span>
                    Published
                  </p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        header: "Duration",
        accessorKey: "duration",
        cell: () => <span className="text-sm font-medium text-richblack-100">2hr 30min</span>,
      },
      {
        header: "Price",
        accessorKey: "price",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-richblack-100">
            ₹{row.original.price}
          </span>
        ),
      },
      {
        header: "Actions",
        accessorKey: "actions",
        cell: ({ row }) => {
          const course = row.original
          return (
            <div className="flex gap-2 text-richblack-100">
              <button
                disabled={loading}
                onClick={() => navigate(`/dashboard/edit-course/${course._id}`)}
                title="Edit"
                className="transition-all duration-200 hover:scale-110 hover:text-caribbeangreen-300"
              >
                <FiEdit2 size={20} />
              </button>
              <button
                disabled={loading}
                onClick={() =>
                  setConfirmationModal({
                    text1: "Do you want to delete this course?",
                    text2: "All the data related to this course will be deleted",
                    btn1Text: !loading ? "Delete" : "Loading...",
                    btn2Text: "Cancel",
                    btn1Handler: !loading ? () => handleCourseDelete(course._id) : () => {},
                    btn2Handler: !loading ? () => setConfirmationModal(null) : () => {},
                  })
                }
                title="Delete"
                className="transition-all duration-200 hover:scale-110 hover:text-[#ff0000]"
              >
                <RiDeleteBin6Line size={20} />
              </button>
            </div>
          )
        },
      },
    ], [loading])
  
    const table = useReactTable({
      data: courses || [],
      columns,
      getCoreRowModel: getCoreRowModel(),
    })
  
    return (
      <>
        <div className="rounded-xl border border-richblack-800 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-richblack-800 text-richblack-100 text-sm uppercase">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="px-6 py-2 text-left">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="text-left px-6 py-3">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-2xl font-medium text-richblack-100">
                    No courses found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-t border-richblack-800">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
  
        {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
      </>
    )
  }
  