namespace JasMaman.Modules.Common {
    /// <summary>Ключи проектов (кабинетов) из appsettings.json → projectsConfig.</summary>
    public static class Projects {
        public const string Public = "JasMamanPublic",
                            Moderator = "JasMamanModerator",
                            Internal = "JasMamanInternal",
                            University = "JasMamanUniversity";

        public static readonly string[] All = { Public, Moderator, Internal, University };

        /// <summary>Кабинеты, где работают с данными МС: сотрудники и модератор.</summary>
        public static readonly string[] Staff = { Moderator, Internal };
    }
}
