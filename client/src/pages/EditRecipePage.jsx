// EditRecipePage.jsx
import { useContext, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';
import Sharepage from "./Sharepage";

export default function EditRecipePage() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/recipes/${id}`)
            .then(res => res.json())
            .then(data => {
                setRecipe(data);
            })
            .catch(err => console.error("Error fetching recipe:", err))
            .finally(() => setLoading(false));
    }, [id]);
    
    if (loading) return <p>Loading...</p>;
    if (!recipe) return <p>Recipe not found</p>;
    if (user.id !== recipe.user.id) return <Navigate to="/" replace />;
    return <Sharepage initialData={recipe} mode="edit" />;
}