import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import AdminSignInForm from "../../components/auth/AdminSignInForm";

export default function AdminSignIn() {
    return (
        <>
            <PageMeta
                title="Admin Sign In | Smart City"
                description="Sign in page for Smart City Administrators"
            />
            <AuthLayout>
                <AdminSignInForm />
            </AuthLayout>
        </>
    );
}
