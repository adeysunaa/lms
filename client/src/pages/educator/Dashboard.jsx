import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets, dummyDashboardData } from "../../assets/assets";
import Loading from "../../components/student/Loading";
import axios from "axios";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator } = useContext(AppContext);
  const [dashboardData, setdashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + "/api/educator/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setdashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData();
    }
  }, [isEducator]);
  return dashboardData ? (
    <div className="min-h-screen w-full flex flex-col gap-10 px-4 md:px-10 py-8 text-white">
      <div className="space-y-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            {
              label: "Total Enrolments",
              value: dashboardData.enrolledStudentsData.length,
              icon: "ri-team-line",
            },
            {
              label: "Total Courses",
              value: dashboardData.totalCourses,
              icon: "ri-book-open-line",
            },
            {
              label: "Total Earnings",
              value: `${currency}${dashboardData.totalEarnings}`,
              icon: "ri-line-chart-line",
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className="glass-card border border-white/15 rounded-3xl px-6 py-5 flex items-center justify-between hover:shadow-[0_25px_60px_rgba(15,3,40,0.45)] transition-all duration-300"
            >
              <div>
                <p className="text-[13px] uppercase tracking-[0.4em] text-white/60">
                  {card.label}
                </p>
                <p className="text-3xl font-semibold mt-2">{card.value}</p>
              </div>
              <span className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <i className={`${card.icon} text-2xl`}></i>
              </span>
            </div>
          ))}
        </div>

        <div className="glass-card border border-white/15 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Latest Activity
              </p>
              <h2 className="text-2xl font-semibold text-white mt-1">
                Latest Enrolments
              </h2>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-white/80">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-4 py-3 hidden sm:table-cell">#</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/10">
                {dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 hidden sm:table-cell text-white/60">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img
                        src={item.student.imageUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                      <span className="text-white truncate">{item.student.name}</span>
                    </td>
                    <td className="px-4 py-3 text-white/80 truncate">
                      {item.courseTitle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Dashboard;
