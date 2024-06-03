const yup = require("yup")
const prisma = require("../utils/prisma")

const salaryValidator = (id) =>
  yup.object({
    user_type: yup
      .string()
      .required("User type is required")
      .test("exist", "User type does not exist", async (value) => {
        const findUserRole = await prisma.roles.findUnique({
          where: {
            name: value,
          },
        })

        return findUserRole ? true : false
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
    due: yup
      .number()
      .nullable()
      .transform((_, val) => (val !== "" ? Number(val) : null)),
    status: yup
      .string()
      .required("Payment status is required")
      .oneOf(["PAID", "UNPAID"]),
  })

module.exports = { salaryValidator }
