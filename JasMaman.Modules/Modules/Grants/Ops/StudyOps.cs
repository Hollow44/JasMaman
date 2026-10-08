using System.Collections.Immutable;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using static JasMaman.Modules.Grants.Ops.GrantOpRules;

namespace JasMaman.Modules.Grants.Ops {
    #region Create — ВУЗ.1 / ВУЗ.1б «Зачисление»

    public record CreateGrantModel(
        string Iin,
        string LastName,
        string FirstName,
        string? MiddleName,
        DateTime? BirthDate,
        string? Phone,
        string? Email,
        long? UniversityId,
        string? UniversityBin,
        string? UniversityName,
        long? SpecialityId,
        string? SpecialityCode,
        string? SpecialityName,
        GrantCategory GrantCategory,
        int? EnrollmentYear,
        string? OrderNumber,
        DateTime? OrderDate,
        string? Comment
    );

    public class CreateGrantOp : GrantOpDefinition<CreateGrantModel> {
        public override GrantOpType OpType => GrantOpType.Create;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(
                (state == null || state.IsEmpty, "Грантник уже зарегистрирован"),
                Actor(user, GrantActor.University | GrantActor.Monitoring)
            );

        public override IEnumerable<string> Validate(GrantState? state, CreateGrantModel model, DateTime today) {
            if (!GrantRules.IsValidIin(model.Iin)) {
                yield return "ИИН должен состоять из 12 цифр";
            }
            if (model.UniversityId == null) {
                yield return "Организация образования не найдена в справочнике";
            }
            if (model.EnrollmentYear is { } year && (year < 1995 || year > today.Year + 1)) {
                yield return "Некорректный год поступления";
            }
        }

        public override GrantState Apply(GrantState? state, CreateGrantModel model, GrantOpApplyContext ctx)
            => GrantState.New(
                new GrantId(ctx.NextId()),
                new GrantPerson(model.Iin, model.LastName, model.FirstName, model.MiddleName, model.BirthDate, model.Phone, model.Email, Address: null),
                new GrantStudy(
                    model.UniversityId, model.UniversityBin, model.UniversityName,
                    model.SpecialityId, model.SpecialityCode, model.SpecialityName,
                    model.GrantCategory, model.GrantCategory.ToEducationLevel(),
                    model.EnrollmentYear, GraduationYear: null, BudgetCost: null,
                    Movement: model.GrantCategory.ToEducationLevel() switch {
                        EducationLevel.Master => StudentMovement.EnteredMaster,
                        EducationLevel.Residency => StudentMovement.EnteredResidency,
                        EducationLevel.Doctorate => StudentMovement.EnteredDoctorate,
                        _ => StudentMovement.Enrolled
                    },
                    MovementDate: model.OrderDate,
                    model.OrderNumber, model.OrderDate
                ),
                ctx.Now
            ) with {
                Notes = string.IsNullOrWhiteSpace(model.Comment)
                    ? ImmutableArray<GrantNote>.Empty
                    : ImmutableArray.Create(new GrantNote(ctx.Now, ctx.User.Name, model.Comment!))
            };

        public override string Summarize(CreateGrantModel model) => $"{model.LastName} {model.FirstName}, {model.UniversityName}";

        public override CreateGrantModel EmptyModel(GrantState? state)
            => new("", "", "", null, null, null, null, null, null, null, null, null, null, GrantCategory.StateOrder, DateTime.Today.Year, null, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, CreateGrantModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            var user = env.RequestContext.GetUserContextForGrantOp();
            var universityFixed = readOnly || (user.Actors & GrantActor.University) != 0 && !user.Is(GrantActor.Monitoring);

            f.flIin.RenderT(panel, env, model.Iin, o);
            f.flLastName.RenderT(panel, env, model.LastName, o);
            f.flFirstName.RenderT(panel, env, model.FirstName, o);
            f.flMiddleName.RenderT(panel, env, model.MiddleName, o);
            f.flBirthDate.RenderT(panel, env, model.BirthDate, o);
            f.flPhone.RenderT(panel, env, model.Phone, o);
            f.flEmail.RenderT(panel, env, model.Email, o);
            f.flUniversityBin.RenderT(panel, env, universityFixed && !readOnly ? user.Xin : model.UniversityBin, GrantOpForm.Options(universityFixed));
            f.flSpecialityCode.RenderT(panel, env, model.SpecialityCode, o);
            f.flGrantCategory.RenderT(panel, env, model.GrantCategory, o);
            f.flEnrollmentYear.RenderT(panel, env, model.EnrollmentYear, o);
            f.flOrderNumber.RenderT(panel, env, model.OrderNumber, o);
            f.flOrderDate.RenderT(panel, env, model.OrderDate, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flIin.ValidateT(env, o => o.Required());
            f.flLastName.ValidateT(env, o => o.Required());
            f.flFirstName.ValidateT(env, o => o.Required());
            f.flMiddleName.ValidateT(env);
            f.flBirthDate.ValidateT(env);
            f.flPhone.ValidateT(env);
            f.flEmail.ValidateT(env);
            f.flUniversityBin.ValidateT(env, o => o.Required());
            f.flSpecialityCode.ValidateT(env);
            f.flGrantCategory.ValidateT(env, o => o.Required());
            f.flEnrollmentYear.ValidateT(env, o => o.Required());
            f.flOrderNumber.ValidateT(env);
            f.flOrderDate.ValidateT(env);
            f.flComment.ValidateT(env);
            if (!env.IsValid) {
                return;
            }

            var user = env.RequestContext.GetUserContextForGrantOp();
            var bin = f.flUniversityBin.GetValueOrNullT(env)?.Trim();
            if (!user.Is(GrantActor.Monitoring) && bin != user.Xin) {
                env.AddError(f.flUniversityBin.FieldName, "Можно регистрировать только студентов своей организации");
            }
            var code = f.flSpecialityCode.GetValueOrNullT(env);
            if (!string.IsNullOrWhiteSpace(code) && CatalogLookup.FindSpeciality(code, env.QueryExecuter) == null) {
                env.AddError(f.flSpecialityCode.FieldName, "Специальность с таким шифром не найдена");
            }
            var iin = f.flIin.GetValueOrNullT(env)?.Trim();
            var category = f.flGrantCategory.GetValueOrNullT(env);
            if (iin != null && category != null && CatalogLookup.HasOpenGrant(iin, category.Value.ToEducationLevel(), env.QueryExecuter)) {
                env.AddError(f.flIin.FieldName, "У обучающегося уже есть действующий грант на этом уровне образования");
            }
        }

        public override CreateGrantModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            var university = CatalogLookup.FindUniversity(f.flUniversityBin.GetValueOrNullT(env), env.QueryExecuter);
            var speciality = CatalogLookup.FindSpeciality(f.flSpecialityCode.GetValueOrNullT(env), env.QueryExecuter);
            return new CreateGrantModel(
                f.flIin.GetValueOrNullT(env)!.Trim(),
                f.flLastName.GetValueOrNullT(env)!.Trim(),
                f.flFirstName.GetValueOrNullT(env)!.Trim(),
                GrantOpForm.Clean(f.flMiddleName.GetValueOrNullT(env)),
                f.flBirthDate.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flPhone.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flEmail.GetValueOrNullT(env)),
                university?.Id, university?.Bin, university?.Name,
                speciality?.Id, speciality?.Code, speciality?.Name,
                f.flGrantCategory.GetValueOrNullT(env)!.Value,
                f.flEnrollmentYear.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flOrderNumber.GetValueOrNullT(env)),
                f.flOrderDate.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region ChangeMovement — ВУЗ.2 «Изменение статуса студента»

    public record ChangeMovementModel(
        StudentMovement Movement,
        DateTime MovementDate,
        string? OrderNumber,
        DateTime? OrderDate,
        string? NewUniversityBin,
        long? NewUniversityId,
        string? NewUniversityName,
        string? Comment
    );

    public class ChangeMovementOp : GrantOpDefinition<ChangeMovementModel> {
        public override GrantOpType OpType => GrantOpType.ChangeMovement;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring),
                UniversityOwnsOrStaff(state, user), StillStudying(state));

        public override IEnumerable<string> Validate(GrantState? state, ChangeMovementModel model, DateTime today) {
            if (model.Movement.CreatesObligation()) {
                yield return "Окончание обучения оформляется операцией «Приказ об окончании»";
            }
            if (model.Movement == StudentMovement.TransferredFromOtherUniversity && model.NewUniversityId == null) {
                yield return "Для перевода укажите БИН организации образования, в которую переведён студент";
            }
            if (model.MovementDate.Date > today) {
                yield return "Дата движения не может быть в будущем";
            }
        }

        public override GrantState Apply(GrantState? state, ChangeMovementModel model, GrantOpApplyContext ctx) {
            var study = state!.Study with {
                Movement = model.Movement,
                MovementDate = model.MovementDate,
                OrderNumber = model.OrderNumber ?? state.Study.OrderNumber,
                OrderDate = model.OrderDate ?? state.Study.OrderDate,
            };
            if (model.NewUniversityId != null) {
                study = study with { UniversityId = model.NewUniversityId, UniversityBin = model.NewUniversityBin, UniversityName = model.NewUniversityName };
            }
            return (state with { Study = study }).AddNote(ctx, model.Comment);
        }

        public override string Summarize(ChangeMovementModel model) => $"{model.Movement.ToDisplayText()} с {model.MovementDate:dd.MM.yyyy}";

        public override ChangeMovementModel EmptyModel(GrantState? state)
            => new(state?.Study.Movement ?? StudentMovement.NextCourse, DateTime.Today, null, null, null, null, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, ChangeMovementModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flMovement.RenderT(panel, env, model.Movement, o);
            f.flMovementDate.RenderT(panel, env, model.MovementDate, o);
            f.flOrderNumber.RenderT(panel, env, model.OrderNumber, o);
            f.flOrderDate.RenderT(panel, env, model.OrderDate, o);
            f.flUniversityBin.RenderT(panel, env, model.NewUniversityBin, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flMovement.ValidateT(env, o => o.Required());
            f.flMovementDate.ValidateT(env, o => o.Required());
            f.flOrderNumber.ValidateT(env, o => o.Required());
            f.flOrderDate.ValidateT(env, o => o.Required());
            f.flUniversityBin.ValidateT(env);
            f.flComment.ValidateT(env);
            var bin = f.flUniversityBin.GetValueOrNullT(env);
            if (env.IsValid && !string.IsNullOrWhiteSpace(bin) && CatalogLookup.FindUniversity(bin, env.QueryExecuter) == null) {
                env.AddError(f.flUniversityBin.FieldName, "Организация образования с таким БИН не найдена");
            }
        }

        public override ChangeMovementModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            var university = CatalogLookup.FindUniversity(f.flUniversityBin.GetValueOrNullT(env), env.QueryExecuter);
            return new ChangeMovementModel(
                f.flMovement.GetValueOrNullT(env)!.Value,
                f.flMovementDate.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flOrderNumber.GetValueOrNullT(env)),
                f.flOrderDate.GetValueOrNullT(env),
                university?.Bin, university?.Id, university?.Name,
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region UpdateContacts — ВУЗ.3 «Подготовка к распределению» (контакты)

    public record UpdateContactsModel(string? Phone, string? Email, string? Address);

    public class UpdateContactsOp : GrantOpDefinition<UpdateContactsModel> {
        public override GrantOpType OpType => GrantOpType.UpdateContacts;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring));

        public override IEnumerable<string> Validate(GrantState? state, UpdateContactsModel model, DateTime today) {
            if (model.Phone != null && !GrantContacts.IsValidPhone(model.Phone)) {
                yield return "Телефон указывается в формате +7XXXXXXXXXX";
            }
        }

        public override GrantState Apply(GrantState? state, UpdateContactsModel model, GrantOpApplyContext ctx)
            => state! with {
                Person = state.Person with {
                    Phone = model.Phone == null ? null : GrantContacts.NormalizePhone(model.Phone),
                    Email = model.Email,
                    Address = model.Address ?? state.Person.Address
                }
            };

        public override string Summarize(UpdateContactsModel model) => string.Join(", ", new[] { model.Phone, model.Email }.Where(x => x != null));

        public override UpdateContactsModel EmptyModel(GrantState? state) => new(state?.Person.Phone, state?.Person.Email, state?.Person.Address);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, UpdateContactsModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flPhone.RenderT(panel, env, model.Phone, o);
            f.flEmail.RenderT(panel, env, model.Email, o);
            f.flAddress.RenderT(panel, env, model.Address, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flPhone.ValidateT(env);
            f.flEmail.ValidateT(env);
            f.flAddress.ValidateT(env);
        }

        public override UpdateContactsModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new UpdateContactsModel(
                GrantOpForm.Clean(f.flPhone.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flEmail.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flAddress.GetValueOrNullT(env))
            );
        }
    }

    public static class GrantContacts {
        /// <summary>Телефон в формате +7XXXXXXXXXX (проверка БМГ требует именно его). Допускаются 8XXXXXXXXXX и пробелы.</summary>
        public static bool IsValidPhone(string phone) => NormalizePhone(phone) is { Length: 12 } p && p.StartsWith("+7") && p[1..].All(char.IsDigit);

        public static string NormalizePhone(string phone) {
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            if (digits.Length == 11 && digits[0] == '8') {
                digits = "7" + digits[1..];
            }
            return "+" + digits;
        }
    }

    #endregion

    #region Graduate — ВУЗ.7 «Приказ об окончании»

    public record GraduateModel(int GraduationYear, string OrderNumber, DateTime OrderDate, decimal? BudgetCost, string? Comment);

    public class GraduateOp : GrantOpDefinition<GraduateModel> {
        public override GrantOpType OpType => GrantOpType.Graduate;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring),
                UniversityOwnsOrStaff(state, user), StillStudying(state),
                (state == null || !state.Study.Movement.EndsStudy(), "Обучение прекращено — выпуск невозможен"));

        public override IEnumerable<string> Validate(GrantState? state, GraduateModel model, DateTime today) {
            if (model.GraduationYear < 2000 || model.GraduationYear > today.Year + 1) {
                yield return "Некорректный год выпуска";
            }
            if (model.BudgetCost is < 0) {
                yield return "Сумма бюджетных расходов не может быть отрицательной";
            }
        }

        public override GrantState Apply(GrantState? state, GraduateModel model, GrantOpApplyContext ctx) {
            var movement = state!.Study.EducationLevel switch {
                EducationLevel.Master => StudentMovement.GraduatedMaster,
                EducationLevel.Residency => StudentMovement.GraduatedResidency,
                EducationLevel.Doctorate => StudentMovement.GraduatedDoctorate,
                _ => StudentMovement.Graduated
            };
            return (state with {
                Study = state.Study with {
                    Movement = movement,
                    MovementDate = model.OrderDate,
                    GraduationYear = model.GraduationYear,
                    OrderNumber = model.OrderNumber,
                    OrderDate = model.OrderDate,
                    BudgetCost = model.BudgetCost ?? state.Study.BudgetCost,
                },
                Obligation = GrantObligation.New(model.GraduationYear),
            }).AddNote(ctx, model.Comment);
        }

        public override string Summarize(GraduateModel model) => $"Приказ № {model.OrderNumber} от {model.OrderDate:dd.MM.yyyy}, выпуск {model.GraduationYear}";

        public override GraduateModel EmptyModel(GrantState? state) => new(DateTime.Today.Year, "", DateTime.Today, state?.Study.BudgetCost, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, GraduateModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flGraduationYear.RenderT(panel, env, model.GraduationYear, o);
            f.flOrderNumber.RenderT(panel, env, model.OrderNumber, o);
            f.flOrderDate.RenderT(panel, env, model.OrderDate, o);
            f.flBudgetCost.RenderT(panel, env, model.BudgetCost, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flGraduationYear.ValidateT(env, o => o.Required());
            f.flOrderNumber.ValidateT(env, o => o.Required());
            f.flOrderDate.ValidateT(env, o => o.Required());
            f.flBudgetCost.ValidateT(env, o => o.Required());
            f.flComment.ValidateT(env);
        }

        public override GraduateModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new GraduateModel(
                f.flGraduationYear.GetValueOrNullT(env)!.Value,
                f.flOrderNumber.GetValueOrNullT(env)!.Trim(),
                f.flOrderDate.GetValueOrNullT(env)!.Value,
                f.flBudgetCost.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    public static class GrantStateNoteExtensions {
        public static GrantState AddNote(this GrantState state, GrantOpApplyContext ctx, string? text)
            => string.IsNullOrWhiteSpace(text)
                ? state
                : state with { Notes = state.Notes.Safe().Add(new GrantNote(ctx.Now, ctx.User.Name, text.Trim())) };
    }
}
