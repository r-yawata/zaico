import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function Index() {
  const navigate = useNavigate();
  
  // ルートパスにアクセスしたら自動的にダッシュボードにリダイレクト
  useEffect(() => {
    navigate("/dashboard");
  }, [navigate]);
  
  return null; // リダイレクト中は何も表示しない
} 