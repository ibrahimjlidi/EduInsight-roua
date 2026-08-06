// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShowcase from "../components/AuthShowcase";
import { registerUser } from "../api/authApi";
import { getDepartments } from "../api/departmentApi";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  // Champs spécifiques Teacher
  const [speciality, setSpeciality] = useState("");
  const [office, setOffice] = useState("");

  // Champs spécifiques Student
  const [level, setLevel] = useState("L1");

  // Champ commun Teacher + Student
  const [department, setDepartment] = useState("");

  // Liste des départements récupérée du backend
  const [departments, setDepartments] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Récupère la liste des départements au chargement de la page
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
        if (data.length > 0) setDepartment(data[0]._id); // sélectionne le 1er par défaut
      } catch (err) {
        console.error("Erreur lors du chargement des départements", err);
      }
    };
    fetchDepartments();
  }, []); // [] = s'exécute une seule fois, au montage du composant

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    // Construit le payload de base
    const payload = { firstName, lastName, email, password, role };

    // Ajoute les champs spécifiques selon le rôle choisi
    if (role === "teacher") {
      payload.speciality = speciality;
      payload.office = office;
      payload.department = department;
    } else if (role === "student") {
      payload.level = level;
      payload.department = department;
    }

    try {
      await registerUser(payload);
      alert("Compte créé avec succès !");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-3xl flex overflow-hidden">
        <AuthShowcase />

        <div className="flex-1 p-10 flex flex-col justify-center overflow-y-auto max-h-screen">
          <p className="text-xs tracking-widest text-slate-500 mb-1">ACCESS PORTAL</p>
          <h2 className="text-3xl font-bold text-white mb-8">Create account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </div>
          )
          }

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-slate-400">Full Name</label>
              <input
                type="text"
                placeholder="Amara Benali"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-2">Choose your role</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`rounded-xl py-3 border transition ${
                    role === "student"
                      ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                      : "border-slate-800 text-slate-400"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`rounded-xl py-3 border transition ${
                    role === "teacher"
                      ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                      : "border-slate-800 text-slate-400"
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            {/* Champs spécifiques TEACHER — affichés seulement si role === "teacher" */}
            {role === "teacher" && (
              <>
                <div>
                  <label className="text-sm text-slate-400">Speciality</label>
                  <input
                    type="text"
                    placeholder="MERN Stack & Web Dev"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    required
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400">Office</label>
                  <input
                    type="text"
                    placeholder="B-204"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Champ spécifique STUDENT — affiché seulement si role === "student" */}
            {role === "student" && (
              <div>
                <label className="text-sm text-slate-400">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                  <option value="M1">M1</option>
                  <option value="M2">M2</option>
                </select>
              </div>
            )}

            {/* Champ commun DEPARTMENT — affiché pour teacher ET student, jamais pour admin */}
            {(role === "teacher" || role === "student") && (
              <div>
                <label className="text-sm text-slate-400">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {departments.length === 0 && (
                    <option value="">Chargement des départements...</option>
                  )}
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 transition text-slate-950 font-semibold rounded-xl py-3 disabled:opacity-50"
            >
              {loading ? "Création..." : "Create account"}
            </button>
          </form>

          <p className="text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-cyan-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;