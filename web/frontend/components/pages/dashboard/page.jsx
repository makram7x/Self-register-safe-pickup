/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/teY5wMP38AF
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"

export default function Dashboard() {
  return (
    (<div >
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Assigned Parents</CardTitle>
                <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">987</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+10% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Assigned Drivers</CardTitle>
                <CarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">321</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+8% from last month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
                <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+3 since last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Completed Pickups</CardTitle>
                <CheckIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">987</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+50 since last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Announcements Sent</CardTitle>
                <MegaphoneIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">+2 since last hour</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Student Information</CardTitle>
                <Button className="shrink-0" size="sm">
                  Add Student
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Driver</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">John Doe</TableCell>
                      <TableCell>5th</TableCell>
                      <TableCell>Jane Doe</TableCell>
                      <TableCell>Bob Smith</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Jane Smith</TableCell>
                      <TableCell>3rd</TableCell>
                      <TableCell>John Smith</TableCell>
                      <TableCell>Alice Johnson</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Michael Lee</TableCell>
                      <TableCell>2nd</TableCell>
                      <TableCell>Sarah Lee</TableCell>
                      <TableCell>David Kim</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Button className="shrink-0" size="sm">
                  New Announcement
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Early Dismissal on Friday</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sent 2 hours ago</p>
                    </div>
                    <Button className="shrink-0" size="icon" variant="ghost">
                      <DeleteIcon className="h-4 w-4" />
                      <span className="sr-only">Edit announcement</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">PTA Meeting Next Week</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sent 1 day ago</p>
                    </div>
                    <Button className="shrink-0" size="icon" variant="ghost">
                      <DeleteIcon className="h-4 w-4" />
                      <span className="sr-only">Edit announcement</span>
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">School Closed Tomorrow</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sent 3 days ago</p>
                    </div>
                    <Button className="shrink-0" size="icon" variant="ghost">
                      <DeleteIcon className="h-4 w-4" />
                      <span className="sr-only">Edit announcement</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Pick-up Process</CardTitle>
                <Button className="shrink-0" size="sm">
                  View Details
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Dismissal Time: 3:00 PM</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Students begin lining up</p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-green-500">On Schedule</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Parent Arrival: 3:15 PM</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Parents begin arriving</p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-yellow-500">Delayed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Student Pickup: 3:30 PM</h4>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  )
}




function CarIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path
        d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>)
  );
}


function CheckIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>)
  );
}


function ClockIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>)
  );
}


function DeleteIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
      <line x1="18" x2="12" y1="9" y2="15" />
      <line x1="12" x2="18" y1="9" y2="15" />
    </svg>)
  );
}





function MegaphoneIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>)
  );
}




function UsersIcon(props) {
  return (
    (<svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>)
  );
}
