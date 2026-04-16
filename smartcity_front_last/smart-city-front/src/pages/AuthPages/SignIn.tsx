import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Smart City Dashboard | Real-Time City Monitoring Platform"
        description="This is the SignIn page for the Smart City Dashboard, providing real-time monitoring, analytics, and management of city operations and services."
      />

      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
