// EditRecipePage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sharepage from "./Sharepage";

export default function EditRecipePage() {
    const { id } = useParams();
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

    return <Sharepage initialData={recipe} mode="edit" />;
}
