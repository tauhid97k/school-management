const yup = require("yup")
const prisma = require("../utils/prisma")

const teacherSalaryValidator = (id) =>
  yup.object({
    teacher_id: yup
      .number()
      .typeError("Teacher id must be a number")
      .required("Teacher id is required")
      .test("exist", "Teacher id does not exist", async (value) => {
        const teacher = await prisma.teachers.findUnique({
          where: {
            id: value,
          },
        })

        if (teacher) return true
        else return false
      }),
    amount: yup
      .number()
      .integer()
      .typeError("Amount must be a valid number")
      .required("Amount is required"),
    bonus: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== "" ? Number(val) : null)),
    advance: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== "" ? Number(val) : null)),
    status: yup.string().required("Payment status is required").oneOf(["PAID"]),
  })

module.exports = { teacherSalaryValidator }
