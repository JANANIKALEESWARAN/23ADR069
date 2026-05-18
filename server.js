const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = 3000;


const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJramFuYW5pLjIzYWlkQGtvbmd1LmVkdSIsImV4cCI6MTc3OTA4MTk5OSwiaWF0IjoxNzc5MDgxMDk5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZDA5Y2RhMzMtNWY5Ni00YWRlLWEzZmEtODgyNTUxNzE3NmI5IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiamFuYW5pIGsiLCJzdWIiOiJhMGE1NDFlNC0yN2VjLTRhNTMtOGY3MS05ZDc2YTIxMjZlY2YifSwiZW1haWwiOiJramFuYW5pLjIzYWlkQGtvbmd1LmVkdSIsIm5hbWUiOiJqYW5hbmkgayIsInJvbGxObyI6IjIzYWRyMDY5IiwiYWNjZXNzQ29kZSI6IlJ5WkJjeSIsImNsaWVudElEIjoiYTBhNTQxZTQtMjdlYy00YTUzLThmNzEtOWQ3NmEyMTI2ZWNmIiwiY2xpZW50U2VjcmV0IjoiV0djanRFc2VVYVdUanduVyJ9.KMiH9Uv3JoM-t9rI5NqI2OcMnmJGjoz_rjt37kyA8RQ";

const api = axios.create({
    baseURL: "http://4.224.186.213/evaluation-service",
    headers: {
        Authorization: `Bearer ${TOKEN}`
    }
});



function optimizeVehicles(vehicles, budget) {

    const n = vehicles.length;

    const dp = Array.from(
        { length: n + 1 },
        () => Array(budget + 1).fill(0)
    );

    for (let i = 1; i <= n; i++) {

        const duration = vehicles[i - 1].serviceDuration;
        const impact = vehicles[i - 1].impactScore;

        for (let w = 0; w <= budget; w++) {

            if (duration <= w) {

                dp[i][w] = Math.max(
                    impact + dp[i - 1][w - duration],
                    dp[i - 1][w]
                );

            } else {

                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    

    let selectedVehicles = [];

    let w = budget;

    for (let i = n; i > 0; i--) {

        if (dp[i][w] !== dp[i - 1][w]) {

            selectedVehicles.push(vehicles[i - 1]);

            w -= vehicles[i - 1].serviceDuration;
        }
    }

    return {
        maxImpactScore: dp[n][budget],
        selectedVehicles: selectedVehicles.reverse()
    };
}



app.get("/optimize-maintenance", async (req, res) => {

    try {

        

        const depotsResponse = await api.get("/depots");

        const depots = depotsResponse.data;

        const vehiclesResponse = await api.get("/vehicles");

        const vehicles = vehiclesResponse.data;

       

        const results = [];

        for (const depot of depots) {

            const depotVehicles = vehicles.filter(
                vehicle => vehicle.depotId === depot.id
            );


            const budget = depot.dailyMechanicHours;

            const optimized = optimizeVehicles(
                depotVehicles,
                budget
            );

            results.push({
                depotId: depot.id,
                depotName: depot.name,
                mechanicHourBudget: budget,
                totalImpactScore: optimized.maxImpactScore,
                selectedVehicles: optimized.selectedVehicles
            });
        }

        res.status(200).json({
            success: true,
            results
        });

    } catch (error) {

        console.log(error.message);

        res.status(500).json({
            success: false,
            message: "Error optimizing maintenance tasks",
            error: error.message
        });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});